import { Bezier } from 'bezier-js'
import {
  vectorLength,
  lineToVector,
  linePointFromT,
  lineTFromPoint,
  nearestPointOnLineForPoint,
  subtractVector,
} from '@/lib/vector.js'

/*
To add to element classes:

TODO NEXT:
Create add connections mixin for elements

When objects added to projector:
- setSegmentCount(n_segments)
- addConnections(array of existing elements)
    - We do this once for element and once for reversed element

- getPrevConnections(): returns values from set of previous connections
- getPostConnections(): ""
- addPrevConnection(obj)
- addPostConnection(obj)



- add connections logic
    - projector stores element objects and connections are object reference instead of array indices
methods:
setSegmentCount
getNearestPointForPoint
getTfromPoint
getPointFromT (replaces getPointOnElement method used in Projector)
lineFromTbounds? (or leave this in projector?)


preprocess creates WrappedCubicBezier and WrappedLine subclasses, which add intersecting and splitting
methods.



*/

const connectionsMixin = {
  dist_epsilon: 1,

  addConnections(elems) {
    elems.forEach((el2) => {
      if (vectorLength(subtractVector(this.p1, el2.p2)) < this.dist_epsilon) {
        this.addPrevConnection(el2)
        el2.addPostConnection(this)
      }

      if (vectorLength(subtractVector(this.p2, el2.p1)) < this.dist_epsilon) {
        this.addPostConnection(el2)
        el2.addPrevConnection(this)
      }
    })
  },

  addPrevConnection(elem) {
    if (this.prev_connections === undefined) {
      this.prev_connections = new Set()
    }
    this.prev_connections.add(elem)
  },

  addPostConnection(elem) {
    if (this.post_connections === undefined) {
      this.post_connections = new Set()
    }
    this.post_connections.add(elem)
  },

  getPrevConnections() {
    return [...(this.prev_connections?.values() ?? [])]
  },

  getPostConnections() {
    return [...(this.post_connections?.values() ?? [])]
  },
}

class Element {
  setSegmentCount(n_segments) {
    this.n_segments = n_segments
  }
}

class Line extends Element {
  n_segments = 1

  constructor(config) {
    super()
    this.id = config['id']
    this.p1 = config['p1']
    this.p2 = config['p2']
    this.length = vectorLength(lineToVector({ p1: this.p1, p2: this.p2 }))
  }

  reverse() {
    const config = {
      id: this.id,
      p1: this.p2,
      p2: this.p1,
      length: this.length,
    }
    return new Line(config)
  }

  getPathString(includeMoveTo, t_start, t_end) {
    let path_str = ''
    if (includeMoveTo) {
      const p1 = linePointFromT(this, t_start)
      path_str += `M ${p1.x},${p1.y} `
    }
    const p2 = linePointFromT(this, t_end)
    path_str += `L ${p2.x},${p2.y}`

    return path_str
  }

  getTfromPoint(point) {
    return lineTFromPoint(this, point)
  }

  getPointFromT(t) {
    return linePointFromT(this, t)
  }

  getNearestPointForPoint(point) {
    return nearestPointOnLineForPoint(this, point)
  }
}

class CubicBezier extends Element {
  constructor(config) {
    super()
    this.id = config['id']
    this.p1 = config['p1']
    this.c1 = config['c1']
    this.c2 = config['c2']
    this.p2 = config['p2']
    this.bezier = new Bezier(
      this.p1.x,
      this.p1.y,
      this.c1.x,
      this.c1.y,
      this.c2.x,
      this.c2.y,
      this.p2.x,
      this.p2.y
    )
    this.length = this.bezier.length()
    this.n_segments = config.n_segments || 10
  }

  // returns a new CubicBezier with the reversal of this curve
  reverse() {
    const config = {
      id: this.id,
      p1: this.p2,
      p2: this.p1,
      c1: this.c2,
      c2: this.c1,
      n_segments: this.n_segments,
      length: this.length,
    }
    return new CubicBezier(config)
  }

  getPathString(includeMoveTo, t_start, t_end) {
    let path_str = ''
    let b

    if (t_start < t_end) {
      b = this.bezier.split(t_start, t_end)
    } else {
      b = this.reverse().bezier.split(1 - t_start, 1 - t_end)
    }

    if (includeMoveTo) {
      path_str += `M ${b.points[0].x},${b.points[0].y} `
    }

    path_str += `C ${b.points[1].x}, ${b.points[1].y} `
    path_str += `${b.points[2].x}, ${b.points[2].y} `
    path_str += `${b.points[3].x}, ${b.points[3].y}`

    return path_str
  }

  getNearestPointForPoint(point) {
    return this.bezier.project(point)
  }

  getPointFromT(t) {
    return this.bezier.get(t)
  }

  getTfromPoint(point) {
    return this.getNearestPointForPoint(point)
  }
}

Object.assign(Line.prototype, connectionsMixin)
Object.assign(CubicBezier.prototype, connectionsMixin)

export { Line, CubicBezier }
