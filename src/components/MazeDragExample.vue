<template>
  <div class="maze-box" style="">
    <div style="position: absolute; top: 0px; left: 0px; padding-left: 5rem">
      <p @click="debug">DEBUG</p>
    </div>
    <MazeSvg ref="reference-maze" width="100%" height="100%" />
  </div>
</template>

<script>
import MazeSvg from '@/components/MazeSvg.vue'
import { preprocess } from '@/lib/preprocess.js'
import { Projector, getPointOnElement } from '@/lib/projection.js'

export default {
  name: 'MazeDragExample',
  components: { MazeSvg },
  data() {
    return {
      preprocessing: true,
      projector: new Projector(),
      movePoint: undefined,
      scaleFactor: undefined,
      mouse_x: undefined,
      mouse_y: undefined,
      moveBuffer: [],
      moveBufferLength: 5,
    }
  },
  mounted() {
    this.preprocessing = true
    console.log('mounted')

    // <circle id="movePoint" cx="100" cy="100" r="12" />

    this.onResize()
    window.addEventListener('resize', this.onResize)

    setTimeout(async () => {
      console.log('starting to process')
      let elements = await preprocess(this.$refs['reference-maze'].$el)
      console.log('processed', elements.length, 'elements')
      this.preprocessing = false
      elements.forEach((e) => this.projector.addElement(e))
      const proj = this.projector
      console.log(proj.getAllLinesForT(0, 2))
      console.log(proj.findMoves({ x: 15, y: 10 }, 0, 2, 0, []))
      console.log(proj.moveRecursive({ x: 15, y: 10 }, 0, 2))
      const point = this.projector.getPoint()
      this.addMovePoint(point.x, point.y)

      debugger
      this.projector.elements.forEach((e, i) =>
        console.log(
          i,
          ': prev=',
          e.prev_connections,
          ', post=',
          e.post_connections
        )
      )
    }, 0)
  },
  methods: {
    debug() {
      debugger
    },
    addMovePoint(x, y) {
      const svgElem = this.$refs['reference-maze'].$el
      const circleElem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      )
      circleElem.setAttribute('cx', x)
      circleElem.setAttribute('cy', y)
      circleElem.setAttribute('r', 3.5)
      circleElem.setAttribute('fill', 'red')
      circleElem.id = 'movePoint'
      svgElem.appendChild(circleElem)
      this.movePoint = circleElem
      this.movePoint.addEventListener(
        'mousedown',
        this.mousedownHandler.bind(this, this.movePointMousemove)
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

      this.addToMoveBuffer(moveVector)
      const newMoveVector = this.getAggregateMoveVec()
      const expMoveVector = this.getExponentialMoveVec()

      console.log('movePointMousemove: moveVector=', moveVector)
      console.log('movePointMousemove: newMoveVector=', newMoveVector)
      console.log('movePointMousemove: expMoveVector=', expMoveVector)
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

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY
    },

    updateMovePoint(x, y) {
      this.movePoint.setAttribute('cx', x)
      this.movePoint.setAttribute('cy', y)
    },

    addToMoveBuffer(moveVec) {
      if (this.moveBuffer.length == this.moveBufferLength)
        this.moveBuffer.shift()
      this.moveBuffer.push(moveVec)
    },

    getAggregateMoveVec() {
      return this.moveBuffer.reduce(
        (s, v) => {
          return {
            x: s.x + v.x / this.moveBufferLength,
            y: s.y + v.y / this.moveBufferLength,
          }
        },
        { x: 0, y: 0 }
      )
    },

    getExponentialMoveVec() {
      const alpha = 0.8
      let moveBuffer = [...this.moveBuffer]
      return moveBuffer.reduce((s, v) => {
        return {
          x: s.x * (1 - alpha) + v.x * alpha,
          y: s.y * (1 - alpha) + v.y * alpha,
        }
      }, moveBuffer.shift())
    },

    onResize() {
      //debugger
      const svgRect = this.$refs['reference-maze'].$el.getBoundingClientRect()
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
