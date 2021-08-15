import { lineToVector, traverseVector } from '@/lib/vector.js'
import { CubicBezier } from '@/lib/elements.js'

/*function reverseElement(el) {
  if (el.type == 'line') {
    return reverseLine(el)
  } else if (el.type == 'cubic') {
    return reverseCubic(el)
  }
}

function reverseLine(line) {
  return Object.assign({}, line, { p1: line.p2, p2: line.p1 })
}

function reverseCubic(cubic) {
  return Object.assign({}, cubic, {
    p1: cubic.p2,
    p2: cubic.p1,
    c1: cubic.c2,
    c2: cubic.c1,
  })
}*/

/*function cubicPointFromT(w, t) {
  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  return {
    t: t,
    x: w.p1.x * mt3 + 3 * w.c1.x * mt2 * t + 3 * w.c2.x * mt * t2 + w.p2.x * t3,
    y: w.p1.y * mt3 + 3 * w.c1.y * mt2 * t + 3 * w.c2.y * mt * t2 + w.p2.y * t3,
  }
}*/

/*function getPointOnElement(el, t) {
  if (el instanceof Line) {
    return linePointFromT(el, t)
  } else if (el instanceof CubicBezier) {
    return cubicPointFromT(el, t)
  }
}*/

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
  element_index = 2
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
  /*addElement(el) {
    const el_index = this.elements.length
    this.addSegmentCount(el)
    //const el_rev = reverseElement(el)
    const el_rev = el.reverse()
    const el_rev_index = this.elements.length + 1

    this.addConnections(el, el_index)
    this.addConnections(el_rev, el_rev_index)

    this.elements.push(el)
    this.elements.push(el_rev)
  }*/

  /*addConnections(el1, el1_i) {
    el1.prev_connections = new Set()
    el1.post_connections = new Set()

    this.elements.forEach((el2, i) => {
      if (vectorLength(subtractVector(el1.p1, el2.p2)) < this.dist_epsilon) {
        el1.prev_connections.add(i)
        el2.post_connections.add(el1_i)
      }
      if (vectorLength(subtractVector(el1.p2, el2.p1)) < this.dist_epsilon) {
        el1.post_connections.add(i)
        el2.prev_connections.add(el1_i)
      }
    })
  }*/

  /*addSegmentCount(el) {
    if (el instanceof CubicBezier) {
      el.n_segments = Math.max(
        this.min_segments,
        Math.ceil(el.length / this.granularity)
      )
    }
  }*/

  /*getAllLinesForT(t_, element_index_) {
    const epsilon = 0.000001

    const n_segments = this.elements[element_index_].n_segments
    const seg_pos = t_ / (1 / n_segments)
    const current_seg = Math.floor(seg_pos)

    const segs = new Set()
    segs.add(Math.floor(seg_pos))
    segs.add(Math.floor(seg_pos + epsilon))
    segs.add(Math.floor(seg_pos - epsilon))

    const seg_value_array = [...segs.values()]
    //console.log('seg_value_array: ', seg_value_array)

    return seg_value_array.flatMap((s) => {
      let element = this.elements[element_index_]

      // =============== Moving to previous or next element ===============
      if (s == -1) {
        // We're epsilon close to the start of segment 0 of the path
        // so we include the last segment of the previous path (if this exists)
        const prev_elems_i = [...element.prev_connections.values()]

        return prev_elems_i.map((i) => {
          const new_el = this.elements[i]
          const t_bounds = this.segmentBoundsForS(
            new_el.n_segments - 1,
            new_el.n_segments
          )
          return {
            t_bounds: t_bounds,
            t: t_bounds[1],
            line: this.lineFromTbounds(new_el, t_bounds),
            i: i,
          }
        })
      } else if (s == n_segments) {
        // We're epsilon close the end of the last segment of the path
        // so we include the first segment of the next path (if this exists)
        const next_elems_i = [...element.post_connections.values()]

        return next_elems_i.map((i) => {
          const new_el = this.elements[i]
          const t_bounds = this.segmentBoundsForS(0, new_el.n_segments)
          return {
            t_bounds: t_bounds,
            t: t_bounds[0],
            line: this.lineFromTbounds(new_el, t_bounds),
            i: i,
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
        t_new = t_
      }

      return [
        {
          t_bounds: t_bounds,
          t: t_new,
          line: this.lineFromTbounds(element, t_bounds),
          i: element_index_,
        },
      ]
    })
  }*/

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
    //console.log('seg_value_array: ', seg_value_array)

    return seg_value_array.flatMap((s) => {
      //let element = this.elements[element_index_]

      // =============== Moving to previous or next element ===============
      if (s == -1) {
        // We're epsilon close to the start of segment 0 of the path
        // so we include the last segment of the previous path (if this exists)
        //const prev_elems_i = [...element.prev_connections.values()]

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

        /*return prev_elems_i.map((i) => {
          const new_el = this.elements[i]
          const t_bounds = this.segmentBoundsForS(
            new_el.n_segments - 1,
            new_el.n_segments
          )
          return {
            t_bounds: t_bounds,
            t: t_bounds[1],
            line: this.lineFromTbounds(new_el, t_bounds),
            i: i,
          }
        })*/
      } else if (s == n_segments) {
        // We're epsilon close the end of the last segment of the path
        // so we include the first segment of the next path (if this exists)
        //const next_elems_i = [...element.post_connections.values()]

        return element.getPostConnections().map((e) => {
          const t_bounds = this.segmentBoundsForS(0, e.n_segments)
          return {
            t_bounds: t_bounds,
            t: t_bounds[0],
            line: this.lineFromTbounds(e, t_bounds),
            element: e,
          }
        })

        /*return next_elems_i.map((i) => {
          const new_el = this.elements[i]
          const t_bounds = this.segmentBoundsForS(0, new_el.n_segments)
          return {
            t_bounds: t_bounds,
            t: t_bounds[0],
            line: this.lineFromTbounds(new_el, t_bounds),
            i: i,
          }
        })*/
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
    console.log(
      'getMove(v:',
      v,
      ', t:',
      t,
      ', current_element:',
      current_element
    )
    //debugger
    const moves = this.findMoves(v, t, t, current_element, 0, [])
    console.log('getMove: moves: ', moves)
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

  /*moveRecursive(v, t_, element_index_) {
    const moves = this.findMoves(v, t_, t_, element_index_, 0, [])
    console.log('moveRecursive: moves: ', moves)
    const max_distance = Math.max(...moves.map((m) => m.total_distance))
    const best_move_i = moves.findIndex((m) => m.total_distance == max_distance)
    if (best_move_i == -1) {
      return {
        t: t_,
        i: element_index_,
        distance: 0,
      }
    } else {
      return moves[best_move_i]
    }
  }*/

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
            journey: journey,
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

  /*findMoves(v, t_old, t_, element_index_, distance, journey) {
    journey = [
      ...journey,
      {
        element_index: element_index_,
        t_start: t_old,
        t_end: t_,
        distance: distance,
      },
    ]

    const epsilon = 0.000001

    const lines = this.getAllLinesForT(t_, element_index_)

    let all_moves = lines.map((x) => {
      const line_vec = lineToVector(x.line)
      const t_unbounded = rescale(x.t, x.t_bounds, [0, 1])
      const moved = traverseVector(line_vec, t_unbounded, v)
      const t_new = moved.t
      const v_new = moved.new_move_vec
      const moved_distance = moved.distance
      const t_new_bounded = rescale(t_new, [0, 1], x.t_bounds)
      return {
        ...x,
        t_new: t_new_bounded,
        v_new: v_new,
        distance: moved_distance,
      }
    })

    if (Math.max(...all_moves.map((x) => x.distance)) >= epsilon) {
      // If we've got a good move, filter out the bad ones
      all_moves = all_moves.filter((x) => x.distance >= epsilon)
    }

    const evaluated_moves = all_moves.flatMap((m) => {
      if (m.distance < epsilon) {
        return [
          {
            t: m.t_new,
            i: m.i,
            total_distance: distance,
            journey: journey,
          },
        ]
      } else {
        return this.findMoves(
          m.v_new,
          m.t,
          m.t_new,
          m.i,
          distance + m.distance,
          journey
        )
      }
    })

    return evaluated_moves
  }*/

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

  /*moveTo(move) {
    this.t = move.t
    this.element_index = move.i
  }*/
  moveTo(move) {
    this.t = move.t
    this.current_element = move.element
  }

  /*getPoint() {
    return getPointOnElement(this.elements[this.element_index], this.t)
  }*/
  getPoint() {
    return this.current_element.getPointFromT(this.t)
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
