export function traverseVector(vec, start_t, move_vec) {
  /*
    Moves along vector vec as much as possible according to move_vec starting at start_t.
    We return the new t position and also how much of move_vec hasn't been 'used up' by the 
    move.
  
    vec = Vector along which we will be moving
    start_t = Position along vec: 0 = start, 1 = end
    move_vec = Movement vector
  
    returns {
      t: new t position along vec after move
      new_move_vec: how much of move_vec remains to be used up
    }
    */

  const vec_point = linePointFromT(vectorToLine(vec), start_t)
  const move_vec_proj = vectorProject(move_vec, vec)

  let new_vec_point = addVector(vec_point, move_vec_proj)

  new_vec_point = nearestPointOnLineForPoint(vectorToLine(vec), new_vec_point)
  const end_t = new_vec_point.t

  const moved_vec = subtractVector(new_vec_point, vec_point)

  const remaining_move_pct =
    vectorLength(move_vec_proj) == 0
      ? 1
      : 1 - vectorLength(moved_vec) / vectorLength(move_vec_proj)

  const new_move_vec = {
    x: move_vec.x * remaining_move_pct,
    y: move_vec.y * remaining_move_pct,
  }

  return {
    t: end_t,
    new_move_vec: new_move_vec,
    distance: vectorLength(moved_vec),
  }
}

export function subtractVector(v1, v2) {
  // returns v1 - v2
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y,
  }
}

export function addVector(v1, v2) {
  // returns v1 + v2
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
  }
}

export function lineToVector(line) {
  return {
    x: line.p2.x - line.p1.x,
    y: line.p2.y - line.p1.y,
  }
}

export function vectorToLine(vec) {
  return {
    p1: { x: 0, y: 0 },
    p2: vec,
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

export function nearestPointOnLineForPoint(line, point) {
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
