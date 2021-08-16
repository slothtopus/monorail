import { Bezier } from 'bezier-js'
import Snap from '@creately/snapsvg'
import {
  vectorLength,
  subtractVector,
  intersectLines,
  linePointFromT,
  lineTFromPoint,
  nearestPointOnLineForPoint,
} from '@/lib/vector.js'
import { CubicBezier, Line } from '@/lib/elements.js'

async function preprocess(mainSvg) {
  let elements = wrapAllElements(mainSvg)
  intersectAll(elements)
  return elements.flatMap((e) => e.split())
}

function wrapAllElements(mainSvg) {
  let elements = [...mainSvg.getElementsByTagName('path')].flatMap((e) => {
    // https://stackoverflow.com/questions/30277646/svg-convert-arcs-to-cubic-bezier
    const b = Snap.path.toCubic(Snap(e))
    let beziers = []
    // In the @creately/snapsvg version, the last element of Snap.path.toCubic is an odd
    // vertical straight line, so we do length - 1 to get rid of this
    for (let i = 1; i < b.length - 1; i++) {
      //debugger
      /*const wb = new WrappedBezier(
        ...[...b[i - 1].slice(-2), ...b[i].slice(1, b[i].length)]
      )
      wb.id = `${e.id}_B${i - 1}`*/

      const wb = new WrappedCubicBezierNew({
        id: `${e.id}_B${i - 1}`,
        p1: { x: b[i - 1].slice(-2)[0], y: b[i - 1].slice(-2)[1] },
        c1: { x: b[i][1], y: b[i][2] },
        c2: { x: b[i][3], y: b[i][4] },
        p2: { x: b[i][5], y: b[i][6] },
      })
      beziers.push(wb)
    }
    return beziers
  })

  elements = elements.concat(
    [...mainSvg.getElementsByTagName('line')].map((e) => {
      /*const wl = new WrappedLine({
        p1: { x: +e.getAttribute('x1'), y: +e.getAttribute('y1') },
        p2: { x: +e.getAttribute('x2'), y: +e.getAttribute('y2') },
      })
      wl.id = e.id*/
      const wl = new WrappedLineNew({
        id: e.id,
        p1: { x: +e.getAttribute('x1'), y: +e.getAttribute('y1') },
        p2: { x: +e.getAttribute('x2'), y: +e.getAttribute('y2') },
      })
      return wl
    })
  )

  return elements
}

function intersectAll(elements) {
  elements.forEach((e1, i1, elements) => {
    elements
      .filter((e2, i2) => i2 != i1)
      .forEach((e2) => {
        e1.intersectWith(e2)
      })
  })
}

/* ---------------------------------------------------- */
/*                New Element Wrappers                  */
/* ---------------------------------------------------- */

const intersectionMixin = {
  addIntersection(t) {
    // Adds intersection at t with el
    //
    // under this distance (in viewbox units) two intersections are
    // considered the same
    const dist_threshold = 1

    const new_point = this.getPointFromT(t)

    const distances = this.intersections.map((i) => {
      const i_point = this.getPointFromT(i)
      const diff = subtractVector(new_point, i_point)
      return vectorLength(diff)
    })

    if (Math.min(...distances) >= dist_threshold) {
      this.intersections.push(t)
    }
  },

  initialiseIntersections() {
    this.intersections = [0, 1]
  },

  addPointIntersection(point) {
    // Adds an intersection with point provided it's less that dist_epsilon away
    const dist_epsilon = 1

    const nearestPoint = this.getNearestPointForPoint(point)
    const diff = subtractVector(nearestPoint, point)

    if (vectorLength(diff) < dist_epsilon) {
      this.addIntersection(nearestPoint.t)
    }
  },
}

class WrappedLineNew extends Line {
  constructor(config) {
    super(config)
    this.initialiseIntersections()
  }

  intersectWith(e) {
    // WrappedLine with WrappedBezier
    if (e instanceof WrappedBezier) {
      e.bezier
        .intersects(this)
        .map((t) => this.getTfromPoint(e.getPointFromT(t)).t)
        .forEach((t) => this.addIntersection(t))

      this.addPointIntersection(e.p1)
      this.addPointIntersection(e.p2)

      // WrappedLine with WrappedLine
    } else if (e instanceof WrappedLine) {
      this.addIntersection(intersectLines(this, e))
    }
  }

  split() {
    // returns an array of Beziers corresponding to the curve split over
    // [0, t1], [t1,t2], [t2,t3], ... , [tn,1]
    this.intersections.sort()

    let lines = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      const new_line = new Line({
        id: this.id + '_' + i,
        p1: this.getPointFromT(this.intersections[i]),
        p2: this.getPointFromT(this.intersections[i + 1]),
      })
      lines.push(new_line)
    }

    return lines
  }
}

class WrappedCubicBezierNew extends CubicBezier {
  constructor(config) {
    super(config)
    this.initialiseIntersections()
  }

  intersectWith(e) {
    // Adds intersections between this curve and e

    if (e instanceof WrappedBezier) {
      // WrappedBezier with WrappedBezier
      this.bezier
        .intersects(e.bezier)
        .map((t) => +t.split('/')[0])
        .forEach((t) => this.addIntersection(t))
    } else if (e instanceof WrappedLine) {
      // WrappedBezier with WrappedLine
      this.bezier.intersects(e).forEach((t) => this.addIntersection(t))
    }
    this.addPointIntersection(e.p1)
    this.addPointIntersection(e.p2)
  }

  split() {
    // returns an array of Beziers corresponding to the curve split over
    // [0, t1], [t1,t2], [t2,t3], ... , [tn,1]
    this.intersections.sort()

    let elements = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      const new_bezier = this.bezier.split(
        this.intersections[i],
        this.intersections[i + 1]
      )

      const elem = new CubicBezier({
        id: this.id + '_' + i,
        p1: new_bezier.points[0],
        c1: new_bezier.points[1],
        c2: new_bezier.points[2],
        p2: new_bezier.points[3],
      })

      elements.push(elem)
    }

    return elements
  }
}

Object.assign(WrappedLineNew.prototype, intersectionMixin)
Object.assign(WrappedCubicBezierNew.prototype, intersectionMixin)

/* ---------------------------------------------------- */
/*                Element Wrappers                      */
/* ---------------------------------------------------- */

class Wrapper {
  intersections = [0, 1]

  addIntersection(t) {
    // Adds intersection at t with el
    //
    // under this distance (in viewbox units) two intersections are
    // considered the same
    const dist_threshold = 1

    const new_point = this.getPointFromT(t)

    const distances = this.intersections.map((i) => {
      const i_point = this.getPointFromT(i)
      const diff = subtractVector(new_point, i_point)
      return vectorLength(diff)
    })

    if (Math.min(...distances) >= dist_threshold) {
      this.intersections.push(t)
    }
  }

  addPointIntersection(point) {
    // Adds an intersection with point provided it's less that dist_epsilon away
    const dist_epsilon = 1

    const nearestPoint = this.getNearestPointForPoint(point)
    const diff = subtractVector(nearestPoint, point)

    if (vectorLength(diff) < dist_epsilon) {
      this.addIntersection(nearestPoint.t)
    }
  }
}

class WrappedLine extends Wrapper {
  line = undefined

  constructor(vals) {
    /*
    Line defined as:
    {p1: {x: x1, y: y1}, p2: {x: x2, y: y2}}
    */
    super()
    this.line = vals
  }

  intersectWith(e) {
    // WrappedLine with WrappedBezier
    if (e instanceof WrappedBezier) {
      e.bezier
        .intersects(this.line)
        .map((t) => this.getTfromPoint(e.bezier.get(t)).t)
        .forEach((t) => this.addIntersection(t))

      this.addPointIntersection(e.bezier.points[0])
      this.addPointIntersection(e.bezier.points[3])

      // WrappedLine with WrappedLine
    } else if (e instanceof WrappedLine) {
      this.addIntersection(intersectLines(this.line, e.line))
    }
  }

  split() {
    // returns an array of Beziers corresponding to the curve split over
    // [0, t1], [t1,t2], [t2,t3], ... , [tn,1]
    this.intersections.sort()

    let lines = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      const new_line = new Line({
        id: this.id + '_' + i,
        p1: this.getPointFromT(this.intersections[i]),
        p2: this.getPointFromT(this.intersections[i + 1]),
      })
      lines.push(new_line)
    }

    return lines
  }

  getNearestPointForPoint(point) {
    return nearestPointOnLineForPoint(this.line, point)
  }

  getTfromPoint(point) {
    return lineTFromPoint(this.line, point)
  }

  getPointFromT(t) {
    return linePointFromT(this.line, t)
  }
}

class WrappedBezier extends Wrapper {
  bezier = undefined

  constructor(...vals) {
    super()
    this.bezier = new Bezier(vals)
  }

  intersectWith(e) {
    // Adds intersections between this curve and e

    if (e instanceof WrappedBezier) {
      // WrappedBezier with WrappedBezier
      this.bezier
        .intersects(e.bezier)
        .map((t) => +t.split('/')[0])
        .forEach((t) => this.addIntersection(t))

      this.addPointIntersection(e.bezier.points[0])
      this.addPointIntersection(e.bezier.points[3])
    } else if (e instanceof WrappedLine) {
      // WrappedBezier with WrappedLine
      this.bezier.intersects(e.line).forEach((t) => this.addIntersection(t))

      this.addPointIntersection(e.line.p1)
      this.addPointIntersection(e.line.p2)
    }
  }

  split() {
    // returns an array of Beziers corresponding to the curve split over
    // [0, t1], [t1,t2], [t2,t3], ... , [tn,1]
    this.intersections.sort()

    let elements = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      const new_bezier = this.bezier.split(
        this.intersections[i],
        this.intersections[i + 1]
      )

      const elem = new CubicBezier({
        id: this.id + '_' + i,
        p1: new_bezier.points[0],
        c1: new_bezier.points[1],
        c2: new_bezier.points[2],
        p2: new_bezier.points[3],
      })

      elements.push(elem)
    }

    return elements
  }

  getNearestPointForPoint(point) {
    return this.bezier.project(point)
  }

  getPointFromT(t) {
    return this.bezier.get(t)
  }
}

export {
  preprocess,
  WrappedLine,
  WrappedBezier,
  WrappedLineNew,
  WrappedCubicBezierNew,
}
