import { lineToVector, traverseVector } from '@/lib/vector.js'
import { CubicBezier } from '@/lib/elements.js'

function rescale(t_, current_bounds, new_bounds) {
  // Rescale a t lying in current_bounds to new_bounds
  t_ = Math.min(Math.max(t_, current_bounds[0]), current_bounds[1])
  const t_norm =
    (t_ - current_bounds[0]) / (current_bounds[1] - current_bounds[0])
  return new_bounds[0] + t_norm * (new_bounds[1] - new_bounds[0])
}

/*=================================================================*/
/*                          PROJECTOR                              */
/*=================================================================*/

class Projector {
  granularity = 2
  min_segments = 10
  //dist_epsilon = 1

  elements = []
  t = 0
  current_element = undefined

  addElement(el) {
    this.setElementSegmentCount(el)
    const el_rev = el.reverse()
    el.addConnections(this.elements)
    el_rev.addConnections(this.elements)
    this.elements.push(el)
    this.elements.push(el_rev)
  }

  setElementSegmentCount(el) {
    if (el instanceof CubicBezier) {
      el.setSegmentCount(
        Math.max(this.min_segments, Math.ceil(el.length / this.granularity))
      )
    }
  }

  setCurrentElement(elem) {
    this.current_element = elem
  }

  getAllLinesForT(t, element) {
    const epsilon = 0.000001

    const n_segments = element.n_segments
    const seg_pos = t / (1 / n_segments)
    const current_seg = Math.floor(seg_pos)

    const segs = new Set()
    segs.add(Math.floor(seg_pos))
    segs.add(Math.floor(seg_pos + epsilon))
    segs.add(Math.floor(seg_pos - epsilon))

    const seg_value_array = [...segs.values()]

    return seg_value_array.flatMap((s) => {
      // =============== Moving to previous or next element ===============
      if (s == -1) {
        // We're epsilon close to the start of segment 0 of the path
        // so we include the last segment of the previous path (if this exists)

        return element.getPrevConnections().map((e) => {
          const t_bounds = this.segmentBoundsForS(
            e.n_segments - 1,
            e.n_segments
          )
          return {
            t_bounds: t_bounds,
            t: t_bounds[1],
            line: this.lineFromTbounds(e, t_bounds),
            element: e,
          }
        })
      } else if (s == n_segments) {
        // We're epsilon close the end of the last segment of the path
        // so we include the first segment of the next path (if this exists)

        return element.getPostConnections().map((e) => {
          const t_bounds = this.segmentBoundsForS(0, e.n_segments)
          return {
            t_bounds: t_bounds,
            t: t_bounds[0],
            line: this.lineFromTbounds(e, t_bounds),
            element: e,
          }
        })
      }

      // =============== Simple moves along an element ===============
      let t_new
      let t_bounds

      if (s > current_seg) {
        // We're epsilon close the end of an internal (i.e. not end or start) segment in the path
        // so we include the next segment in the path
        t_bounds = this.segmentBoundsForS(s, element.n_segments)
        t_new = t_bounds[0]
      } else if (s < current_seg) {
        // We're epsilon close the start of an internal (i.e. not end or start) segment in the path
        // so we include the previous segment in the path
        t_bounds = this.segmentBoundsForS(s, element.n_segments)
        t_new = t_bounds[1]
      } else {
        // We're somewhere in the middle of an internal (i.e. not end or start) segment in the path
        t_bounds = this.segmentBoundsForS(s, element.n_segments)
        t_new = t
      }

      return [
        {
          t_bounds: t_bounds,
          t: t_new,
          line: this.lineFromTbounds(element, t_bounds),
          element: element,
        },
      ]
    })
  }

  getMove(v, t = this.t, current_element = this.current_element) {
    const moves = this.findMoves(v, t, t, current_element, 0, [])
    const max_distance = Math.max(...moves.map((m) => m.total_distance))
    const best_move_i = moves.findIndex((m) => m.total_distance == max_distance)
    if (best_move_i == -1) {
      return {
        t: t,
        i: current_element,
        distance: 0,
      }
    } else {
      return moves[best_move_i]
    }
  }

  findMoves(v, t_old, t_current, element, distance, journey) {
    journey = [
      ...journey,
      {
        element: element,
        t_start: t_old,
        t_end: t_current,
        distance: distance,
      },
    ]

    const epsilon = 0.000001

    const lines = this.getAllLinesForT(t_current, element)

    let all_moves = lines.map((x) => {
      const line_vec = lineToVector(x.line)
      const t_unbounded = rescale(x.t, x.t_bounds, [0, 1])
      const moved = traverseVector(line_vec, t_unbounded, v)
      // can factor these out into the object def below
      const t_new = moved.t
      const v_new = moved.new_move_vec
      const moved_distance = moved.distance
      // --------------------------------------------
      const t_new_bounded = rescale(t_new, [0, 1], x.t_bounds)
      return {
        ...x,
        t_new: t_new_bounded,
        v_new: v_new,
        distance: moved_distance,
      }
    })

    if (Math.max(...all_moves.map((x) => x.distance)) >= epsilon) {
      // If we've got a good move (i.e longer than epsilon), filter out the bad ones
      all_moves = all_moves.filter((x) => x.distance >= epsilon)
    }

    const evaluated_moves = all_moves.flatMap((m) => {
      if (m.distance < epsilon) {
        return [
          {
            t: m.t_new,
            element: m.element,
            total_distance: distance,
            // add final position to journey
            journey: [
              ...journey,
              {
                element: m.element,
                t_start: m.t_new,
                t_end: m.t_new,
                distance: distance,
              },
            ],
          },
        ]
      } else {
        return this.findMoves(
          m.v_new,
          m.t,
          m.t_new,
          m.element,
          distance + m.distance,
          journey
        )
      }
    })

    return evaluated_moves
  }

  journeyToPathString(journey) {
    let paths = journey.reduce((s, x) => {
      let t_vals = s.get(x.element)
      t_vals = t_vals ?? [undefined, undefined]

      let last_key = Array.from(s.keys()).pop()
      last_key = last_key ?? -1

      if (!(x.element === last_key)) {
        t_vals = [x.t_start, x.t_end]
      } else {
        t_vals = [t_vals[0], x.t_end]
      }

      s.set(x.element, t_vals)
      return s
    }, new Map())

    const path_kv = [...paths]
    // path_kv = [[element, [t_start, t_end]], ...]

    const path_str = path_kv
      .filter((x) => x[1][0] != x[1][1])
      .map((x, i) => {
        return x[0].getPathString(i == 0, x[1][0], x[1][1])
      })
      .join(' ')

    return path_str
  }

  moveTo(move) {
    //console.log('moveTo:', move)
    this.t = move.t
    this.current_element = move.element
    this.triggerEnterExitCallbacks(move.journey)
    this.triggerMoveCallback(move)
  }

  triggerEnterExitCallbacks(journey) {
    for (let i = 1; i < journey.length; i++) {
      if (!(journey[i - 1].element === journey[i].element)) {
        journey[i - 1].element.exit && journey[i - 1].element.exit()
        journey[i].element.enter && journey[i].element.enter()
      }
    }
  }

  triggerMoveCallback(move) {
    move.element.move && move.element.move({ t: move.t })
  }

  getPoint(includeHidden = false) {
    if (
      (this.current_element.hiddenX || this.current_element.hiddenY) &&
      !includeHidden
    ) {
      const tzeroPoint = this.current_element.getPointFromT(0)
      let actualPoint = this.current_element.getPointFromT(this.t)
      if (this.current_element.hiddenX) actualPoint.x = tzeroPoint.x
      if (this.current_element.hiddenY) actualPoint.y = tzeroPoint.y
      return actualPoint
    } else {
      return this.current_element.getPointFromT(this.t)
    }
  }

  segmentBoundsForS(s, n_segments) {
    // Return start and end t vals for segment s
    return [s * (1 / n_segments), (s + 1) * (1 / n_segments)]
  }

  lineFromTbounds(el, t_bounds) {
    const p1 = el.getPointFromT(t_bounds[0])
    const p2 = el.getPointFromT(t_bounds[1])
    return { p1: p1, p2: p2 }
  }
}

export { Projector }
