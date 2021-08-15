<template>
  <div class="maze-box" style="">
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
import { Projector } from '@/lib/projection.js'

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
      this.projector.setCurrentElement(this.projector.elements[0])
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

      const vals = this.projector.getMove(expMoveVector)
      console.log('getMove returns: ', vals)
      this.projector.moveTo(vals)
      const new_point = this.projector.getPoint()

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

      const vals = this.projector.getMove(projectVec)
      const path_str = this.projector.journeyToPathString(vals.journey)

      this.projectedPath.setAttribute('d', path_str)
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
