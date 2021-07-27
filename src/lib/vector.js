export function lineToVector(line) {
  return {
    x: line.p2.x - line.p1.x,
    y: line.p2.y - line.p1.y,
  }
}

export function lineParams(line) {
  const vec = lineToVector(line)
  const a = vec.y / vec.x
  const b = line.p1.y - a * line.p1.x
  return {
    a: a,
    b: b,
  }
}

export function linePointFromT(line, t) {
  const vec = lineToVector(line)
  return {
    t: t,
    x: vec.x * t + line.p1.x,
    y: vec.y * t + line.p1.y,
  }
}

export function lineTFromPoint(line, pos) {
  /*
    Gets the t value corresponding to point pos on vector vec.
    It is assumed that pos lies on vec.
    */
  const vec = lineToVector(line)

  const pos_vec = {
    x: pos.x - line.p1.x,
    y: pos.y - line.p1.y,
  }

  const proj_pos = vectorProject(pos_vec, vec)

  // Since pos_vec lies on the line described by vec, we can calculate t
  // from the x or the y coordinate alone
  const t = vec.x == 0 ? proj_pos.y / vec.y : proj_pos.x / vec.x

  return {
    t: t,
    x: proj_pos.x + line.p1.x,
    y: proj_pos.y + line.p1.y,
  }
}

export function lineNearestPointForPoint(line, point) {
  /*
    Gets the nearest position on the line to point
    */
  const pos = lineTFromPoint(line, point)
  if (pos.t < 0) {
    return linePointFromT(line, 0)
  } else if (pos.t > 1) {
    return linePointFromT(line, 1)
  } else {
    return pos
  }
}

export function intersectLines(l1, l2) {
  // returns t, x, y on l1 where l2 intersects
  const l2_params = lineParams(l2)
  const l1_params = lineParams(l1)

  // if lines are parallel they don't intersect
  if (l2_params.a == l1_params.a) return

  const x = (l2_params.b - l1_params.b) / (l1_params.a - l2_params.a)
  const y = l1_params.a * x + l1_params.b

  const l1_t = lineTFromPoint(l1, { x, y }).t
  const l2_t = lineTFromPoint(l2, { x, y }).t

  if (l1_t >= 0 && l1_t <= 1 && l2_t >= 0 && l2_t <= 1) {
    return [l1_t]
  } else {
    return []
  }
}

export function dotProduct(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y
}

// https://en.wikipedia.org/wiki/Vector_projection
// project a onto b
export function vectorProject(a, b) {
  const scalar = dotProduct(a, b) / dotProduct(b, b)
  let v = Object.assign({}, b)
  v.x = scalar * v.x
  v.y = scalar * v.y
  return v
}

export function vectorLength(v) {
  return Math.sqrt(dotProduct(v, v))
}
