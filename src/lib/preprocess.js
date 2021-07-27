import { Bezier } from 'bezier-js'
import Snap from '@creately/snapsvg'
import {
  vectorLength,
  intersectLines,
  linePointFromT,
  lineTFromPoint,
  lineNearestPointForPoint,
} from '@/lib/vector.js'

let colours = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928',
]
let colour_i = 0

async function preprocess(mainSvg, scratchSvg) {
  let elements = wrapAllElements(mainSvg)
  intersectAll(elements)
  drawAllElements(scratchSvg, elements)
}

function wrapAllElements(mainSvg) {
  let elements = [...mainSvg.getElementsByTagName('path')].flatMap((e) => {
    // https://stackoverflow.com/questions/30277646/svg-convert-arcs-to-cubic-bezier
    const b = Snap.path.toCubic(Snap(e))
    let beziers = []
    // In the @creately/snapsvg version, the last element of Snap.path.toCubic is an odd
    // vertical straight line, so we do length - 1 to get rid of this
    for (let i = 1; i < b.length - 1; i++) {
      const wb = new WrappedBezier(
        ...[...b[i - 1].slice(-2), ...b[i].slice(1, b[i].length)]
      )
      wb.id = e.id
      beziers.push(wb)
    }
    return beziers
  })

  elements = elements.concat(
    [...mainSvg.getElementsByTagName('line')].map((e) => {
      const wl = new WrappedLine({
        p1: { x: +e.getAttribute('x1'), y: +e.getAttribute('y1') },
        p2: { x: +e.getAttribute('x2'), y: +e.getAttribute('y2') },
      })
      wl.id = e.id
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

function getColour() {
  const col = colours[colour_i]
  colour_i = (colour_i + 1) % colours.length
  return col
}

function drawAllElements(svgElem, elements) {
  //const svg_elem = document.getElementById('scratch-svg')
  elements.forEach((e) => {
    if (e instanceof WrappedBezier) {
      e.split().forEach((v) => {
        drawPath(v, getColour(), svgElem)
      })
    } else if (e instanceof WrappedLine) {
      e.split().forEach((v) => {
        drawLine(v, getColour(), svgElem)
      })
    }
  })
}

function drawPath(d, stroke, svg_elem) {
  const path_elem = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  )
  path_elem.setAttribute(
    'd',
    `M ${d[0].x},${d[0].y} C ${d[1].x},${d[1].y} ${d[2].x},${d[2].y} ${d[3].x},${d[3].y}`
  )
  path_elem.setAttribute('stroke', stroke)
  path_elem.setAttribute('fill', 'none')
  svg_elem.appendChild(path_elem)
}

function drawLine(vals, stroke, svg_elem) {
  const path_elem = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'line'
  )
  path_elem.setAttribute('x1', vals.p1.x)
  path_elem.setAttribute('y1', vals.p1.y)
  path_elem.setAttribute('x2', vals.p2.x)
  path_elem.setAttribute('y2', vals.p2.y)

  path_elem.setAttribute('stroke', stroke)
  path_elem.setAttribute('fill', 'none')
  svg_elem.appendChild(path_elem)
}

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

    const new_pos = this.getPointFromT(t)

    const distances = this.intersections.map((i) => {
      const i_pos = this.getPointFromT(i)
      const diff_vec = {
        x: new_pos.x - i_pos.x,
        y: new_pos.y - i_pos.y,
      }
      return vectorLength(diff_vec)
    })

    if (Math.min(...distances) >= dist_threshold) {
      this.intersections.push(t)
    }
  }

  addPointIntersection(point) {
    // Adds an intersection with point provided it's less that dist_epsilon away
    const dist_epsilon = 1

    const nearestPoint = this.getNearestPointForPoint(point)
    const diff = {
      x: nearestPoint.x - point.x,
      y: nearestPoint.y - point.y,
    }

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

    let points = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      const new_point = {
        p1: this.getPointFromT(this.intersections[i]),
        p2: this.getPointFromT(this.intersections[i + 1]),
      }
      points.push(new_point)
    }

    return points
  }

  getNearestPointForPoint(point) {
    return lineNearestPointForPoint(this.line, point)
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

    let points = []
    for (let i = 0; i < this.intersections.length - 1; i++) {
      points.push(
        this.bezier.split(this.intersections[i], this.intersections[i + 1])
          .points
      )
    }
    return points
  }

  getNearestPointForPoint(point) {
    return this.bezier.project(point)
  }

  getPointFromT(t) {
    return this.bezier.get(t)
  }
}

export default preprocess
