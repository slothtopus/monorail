import { Bezier } from 'bezier-js'
import { vectorLength, lineToVector, linePointFromT } from '@/lib/vector.js'

/*
To add to element classes:

- add connections logic
    - projector stores element objects and connections are object reference instead of array indices
methods:
setSegmentCount
getNearestPointForPoint
getTfromPoint
getPointFromT (replaces getPointOnElement method used in Projector)


preprocess creates WrappedCubicBezier and WrappedLine subclasses, which add intersecting and splitting
methods.



*/
class Line {
  constructor(config) {
    this.id = config['id']
    this.p1 = config['p1']
    this.p2 = config['p2']
    this.length = vectorLength(lineToVector({ p1: this.p1, p2: this.p2 }))
    this.setSegmentCount()
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

  setSegmentCount() {
    this.n_segments = 1
  }
}

class CubicBezier {
  constructor(config) {
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
}

export { Line, CubicBezier }
