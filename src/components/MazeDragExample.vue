<template>
  <div class="maze-box" style="">
    <!--<div style="position: absolute; top: 0px; left: 0px; padding-left: 5rem">
      <p @click="debug">DEBUG</p>
    </div>-->
    <MazeSvg
      id="reference-maze"
      ref="reference-maze"
      width="100%"
      height="100%"
    />
  </div>
</template>

<script>
import MazeSvg from '@/components/MazeSvg.vue'
import { preprocess } from '@/lib/preprocess.js'
import { Projector, getPointOnElement } from '@/lib/projection.js'
import { linePointFromT } from '@/lib/vector.js'
import { Bezier } from 'bezier-js'

export default {
  name: 'MazeDragExample',
  components: { MazeSvg },
  data() {
    return {
      preprocessing: true,
      projector: new Projector(),
      movePoint: undefined,
      vectorPoint: undefined,
      vectorLine: undefined,
      projectedPath: undefined,
      scaleFactor: undefined,
      mouse_x: undefined,
      mouse_y: undefined,
      moveBuffer: [],
      debugFlag: false,
    }
  },
  mounted() {
    this.preprocessing = true

    this.onResize()
    window.addEventListener('resize', this.onResize)

    setTimeout(async () => {
      console.log('starting to process')
      let elements = await preprocess(this.$refs['reference-maze'].$el)
      console.log('processed', elements.length, 'elements')
      this.preprocessing = false
      elements.forEach((e) => this.projector.addElement(e))

      const point = this.projector.getPoint()
      this.addControls(point.x, point.y)
      this.updateProjectedMove()
    }, 0)
  },
  methods: {
    debug() {
      this.debugFlag = true
    },
    addControls(x, y) {
      const svgElem = this.$refs['reference-maze'].$el

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      elem.id = 'projectedPath'
      svgElem.appendChild(elem)
      this.projectedPath = elem

      let elem = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      elem.setAttribute('x1', x)
      elem.setAttribute('y1', y)
      elem.setAttribute('x2', x + 50)
      elem.setAttribute('y2', y - 50)
      elem.setAttribute('stroke', 'red')
      elem.id = 'vectorLine'
      svgElem.appendChild(elem)
      this.vectorLine = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x)
      elem.setAttribute('cy', y)
      elem.setAttribute('r', 3.5)
      elem.setAttribute('fill', 'grey')
      elem.id = 'movePoint'
      svgElem.appendChild(elem)
      this.movePoint = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x + 50)
      elem.setAttribute('cy', y - 50)
      elem.setAttribute('r', 3.5)
      elem.setAttribute('fill', 'red')
      elem.id = 'vectorPoint'
      svgElem.appendChild(elem)
      this.vectorPoint = elem

      this.movePoint.addEventListener(
        'mousedown',
        this.mousedownHandler.bind(this, this.movePointMousemove)
      )
      this.vectorPoint.addEventListener(
        'mousedown',
        this.mousedownHandler.bind(this, this.vectorPointMousemove)
      )
    },
    mousedownHandler(mousemoveHandler, event) {
      this.mouse_x = event.clientX
      this.mouse_y = event.clientY

      const el = event.target
      el.classList.add('selected')
      document.body.style.cursor = 'pointer'

      function mouseupHandler() {
        el.classList.remove('selected')
        document.body.style.cursor = null
        document.removeEventListener('mousemove', mousemoveHandler)
        document.removeEventListener('mouseup', mouseupHandler)
      }

      document.addEventListener('mousemove', mousemoveHandler)
      document.addEventListener('mouseup', mouseupHandler)
    },

    movePointMousemove(event) {
      const moveVector = {
        x: (event.clientX - this.mouse_x) * this.scaleFactor,
        y: (event.clientY - this.mouse_y) * this.scaleFactor,
      }

      if (moveVector.x == 0 && moveVector.y == 0) return

      this.bufferMoveTimed(moveVector)
      const expMoveVector = this.getExponentialMoveVec()

      const vals = this.projector.moveRecursive(
        expMoveVector,
        this.projector.t,
        this.projector.element_index
      )
      console.log('moveRecursive returns: ', vals)

      this.projector.t = vals.t
      this.projector.element_index = vals.i
      const new_point = getPointOnElement(
        this.projector.elements[this.projector.element_index],
        this.projector.t
      )
      this.updateMovePoint(new_point.x, new_point.y)
      this.updateProjectedMove()

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY
    },

    vectorPointMousemove(event) {
      const moveVector = {
        x: (event.clientX - this.mouse_x) * this.scaleFactor,
        y: (event.clientY - this.mouse_y) * this.scaleFactor,
      }

      if (moveVector.x == 0 && moveVector.y == 0) return

      this.updateVectorPoint(moveVector.x, moveVector.y)

      this.updateProjectedMove()

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY
    },

    updateMovePoint(x, y) {
      this.movePoint.setAttribute('cx', x)
      this.movePoint.setAttribute('cy', y)
      this.vectorLine.setAttribute('x1', x)
      this.vectorLine.setAttribute('y1', y)
    },
    clamp(x, min, max) {
      return Math.min(Math.max(x, min), max)
    },
    updateVectorPoint(x_delta, y_delta) {
      const x = this.clamp(
        +this.vectorPoint.getAttribute('cx') + x_delta,
        -6,
        255
      )
      const y = this.clamp(
        +this.vectorPoint.getAttribute('cy') + y_delta,
        0,
        245
      )
      this.vectorPoint.setAttribute('cx', x)
      this.vectorPoint.setAttribute('cy', y)
      this.vectorLine.setAttribute('x2', x)
      this.vectorLine.setAttribute('y2', y)
    },

    updateProjectedMove() {
      const projectVec = {
        x:
          +this.vectorPoint.getAttribute('cx') -
          +this.movePoint.getAttribute('cx'),
        y:
          +this.vectorPoint.getAttribute('cy') -
          +this.movePoint.getAttribute('cy'),
      }

      const vals = this.projector.moveRecursive(
        projectVec,
        this.projector.t,
        this.projector.element_index
      )

      let paths = vals.journey.reduce((s, x) => {
        let t_vals = s.get(x.element_index)
        t_vals = t_vals === undefined ? [undefined, undefined] : t_vals

        let last_key = Array.from(s.keys()).pop()
        last_key = last_key === undefined ? -1 : last_key

        if (x.element_index != last_key) {
          t_vals = [x.t_start, x.t_end]
        } else {
          t_vals = [t_vals[0], x.t_end]
        }

        s.set(x.element_index, t_vals)
        return s
      }, new Map())

      const path_kv = [...paths]
      const path_str = path_kv
        .filter((x) => x[1][0] != x[1][1])
        .map((x, i) => {
          return this.makePathString(
            this.projector.elements[x[0]],
            x[1][0],
            x[1][1],
            i == 0
          )
        })
        .join(' ')

      this.projectedPath.setAttribute('d', path_str)
    },

    makePathString(elem, t_start, t_end, includeMoveTo) {
      let path_str = ''

      if (elem.type == 'cubic') {
        let b_vals, t_min, t_max
        if (t_start < t_end) {
          t_min = t_start
          t_max = t_end
          b_vals = [
            elem.p1.x,
            elem.p1.y,
            elem.c1.x,
            elem.c1.y,
            elem.c2.x,
            elem.c2.y,
            elem.p2.x,
            elem.p2.y,
          ]
        } else {
          t_min = 1 - t_start
          t_max = 1 - t_end
          b_vals = [
            elem.p2.x,
            elem.p2.y,
            elem.c2.x,
            elem.c2.y,
            elem.c1.x,
            elem.c1.y,
            elem.p1.x,
            elem.p1.y,
          ]
        }
        const b = new Bezier(b_vals).split(t_min, t_max)
        console.log(b)
        if (includeMoveTo) {
          path_str += `M ${b.points[0].x},${b.points[0].y} `
        }

        path_str += `C ${b.points[1].x}, ${b.points[1].y} `
        path_str += `${b.points[2].x}, ${b.points[2].y} `
        path_str += `${b.points[3].x}, ${b.points[3].y}`
      } else if (elem.type == 'line') {
        if (includeMoveTo) {
          const p1 = linePointFromT(elem, t_start)
          path_str += `M ${p1.x},${p1.y} `
        }
        const p2 = linePointFromT(elem, t_end)
        path_str += `L ${p2.x},${p2.y}`
      }

      return path_str
    },

    bufferMoveTimed(moveVec) {
      const oldestMoveMs = 500
      this.moveBuffer.push([Date.now(), moveVec])
      this.moveBuffer = this.moveBuffer.filter(
        (x) => Date.now() - x[0] < oldestMoveMs
      )
    },

    getExponentialMoveVec() {
      const alpha = 0.4
      let moveBuffer = this.moveBuffer.map((x) => x[1])
      return moveBuffer.reduce((s, v) => {
        return {
          x: s.x * (1 - alpha) + v.x * alpha,
          y: s.y * (1 - alpha) + v.y * alpha,
        }
      }, moveBuffer.shift())
    },

    onResize() {
      const svgRect = document
        .getElementById('reference-maze')
        .getBoundingClientRect()
      this.scaleFactor = 261 / Math.min(svgRect.width, svgRect.height)
      console.log('new scaleFactor:', this.scaleFactor)
    },
  },
}
</script>

<style scoped>
.maze-box {
  width: 100%;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  padding: 3rem;
}
</style>
