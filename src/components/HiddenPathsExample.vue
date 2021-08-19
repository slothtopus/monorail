<template>
  <div class="container">
    <svg
      width="100%"
      height="50%"
      viewBox="0 0 1000 500"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      ref="svg-main"
    >
      <rect x="620" y="100" height="68" width="360" fill="grey" />
      <rect x="620" y="230" height="68" width="360" fill="grey" />
    </svg>

    <svg
      width="100%"
      height="50%"
      viewBox="0 0 1000 500"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      ref="svg-guide"
    >
      <path
        d="M 50,200 L 500,200 L 500,400 L 860,400"
        stroke="white"
        stroke-width="3"
        stroke-dasharray="10"
        fill="none"
      />
      <!--<path
        d="M 0,0 L 1000,0 L 1000,500 L 0,500 L 0,0"
        stroke="white"
        fill="none"
      />-->
    </svg>
  </div>
</template>

<script>
import { Projector } from '@/lib/projection.js'
import { Line } from '@/lib/elements.js'

export default {
  name: 'HiddenPathsExample',
  data() {
    return {
      mainProjector: undefined,
      guideProjector: undefined,
      projector: undefined,
      guideCircleElem: undefined,
      controlCircleElem: undefined,
      scaleFactor: undefined,
    }
  },
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize)

    this.setupGuideProjector()
    this.setupMainProjector()

    const guidePoint = this.guideProjector.getPoint(true)
    this.moveGuideCircle(guidePoint)
    const controlPoint = this.mainProjector.getPoint(false)
    this.moveControlCircle(controlPoint)

    //debugger
  },
  methods: {
    setupMainProjector() {
      const l1 = new Line({
        id: 'line1',
        p1: { x: 50, y: 200 },
        p2: { x: 500, y: 200 },
        enter: () => {
          console.log('Main projector: Enter line 1')
        },
        exit: () => {
          console.log('Main projector: Exit line 1')
        },
      })

      const l2 = new Line({
        id: 'line2',
        p1: { x: 500, y: 200 },
        p2: { x: 500, y: 400 },
        enter: () => {
          console.log('Main projector: Enter line 2')
        },
        exit: () => {
          console.log('Main projector: Exit line 2')
        },
        move: (vals) => {
          this.controlCircleElem.setAttribute('r', 120 - 90 * vals.t)
          this.controlCircleElem.setAttribute('cx', 500 + 90 * vals.t)
          console.log(vals.t)
        },
        hiddenX: true,
        hiddenY: true,
      })

      const l3 = new Line({
        id: 'line3',
        p1: { x: 590, y: 200 },
        p2: { x: 950, y: 200 },
        enter: () => {
          console.log('Main projector: Enter line 3')
          this.controlCircleElem.setAttribute('r', 30)
        },
        exit: () => {
          console.log('Main projector: Exit line 3')
        },
      })

      l1.addPostConnection(l2)
      l2.addPrevConnection(l1)
      l2.addPostConnection(l3)
      l3.addPrevConnection(l2)

      const mainProjector = new Projector()
      this.mainProjector = mainProjector
      mainProjector.elements = [l1, l2, l3]
      mainProjector.setCurrentElement(l1)
    },
    setupGuideProjector() {
      const l1 = new Line({
        id: 'line1',
        p1: { x: 50, y: 200 },
        p2: { x: 500, y: 200 },
        enter: () => {
          console.log('Guide projector: Enter line 1')
        },
        exit: () => {
          console.log('Guide projector: Exit line 1')
        },
      })

      const l2 = new Line({
        id: 'line2',
        p1: { x: 500, y: 200 },
        p2: { x: 500, y: 400 },
        enter: () => {
          console.log('Guide projector: Enter line 2')
        },
        exit: () => {
          console.log('Guide projector: Exit line 2')
        },
      })

      const l3 = new Line({
        id: 'line3',
        p1: { x: 500, y: 400 },
        p2: { x: 860, y: 400 },
        enter: () => {
          console.log('Guide projector: Enter line 3')
        },
        exit: () => {
          console.log('Guide projector: Exit line 3')
        },
      })

      l1.addPostConnection(l2)
      l2.addPrevConnection(l1)
      l2.addPostConnection(l3)
      l3.addPrevConnection(l2)

      const guideProjector = new Projector()
      this.guideProjector = guideProjector
      guideProjector.elements = [l1, l2, l3]
      guideProjector.setCurrentElement(l1)
    },
    moveGuideCircle(point) {
      if (this.guideCircleElem === undefined) {
        const svgElem = this.$refs['svg-guide']
        const circleElem = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        )
        circleElem.setAttribute('r', 10)
        circleElem.setAttribute('stroke', 'white')
        circleElem.setAttribute('fill', 'red')
        circleElem.id = 'guideCircle'
        svgElem.appendChild(circleElem)
        this.guideCircleElem = circleElem
      }
      this.guideCircleElem.setAttribute('cx', point.x)
      this.guideCircleElem.setAttribute('cy', point.y)
    },
    moveControlCircle(point) {
      if (this.controlCircleElem === undefined) {
        const svgElem = this.$refs['svg-main']
        const circleElem = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle'
        )
        circleElem.setAttribute('r', 120)
        circleElem.setAttribute('stroke', 'none')
        circleElem.setAttribute('fill', 'red')
        circleElem.id = 'controlCircle'
        circleElem.addEventListener(
          'mousedown',
          this.mousedownHandler.bind(this, this.controlCircleMove)
        )
        svgElem.appendChild(circleElem)
        this.controlCircleElem = circleElem
      }
      this.controlCircleElem.setAttribute('cx', point.x)
      this.controlCircleElem.setAttribute('cy', point.y)
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
    controlCircleMove(event) {
      const moveVector = {
        x: (event.clientX - this.mouse_x) * this.scaleFactor,
        y: (event.clientY - this.mouse_y) * this.scaleFactor,
      }

      if (moveVector.x == 0 && moveVector.y == 0) return

      const guideVals = this.guideProjector.getMove(moveVector)
      this.guideProjector.moveTo(guideVals)
      const guidePoint = this.guideProjector.getPoint(true)
      this.moveGuideCircle(guidePoint)

      const mainVals = this.mainProjector.getMove(moveVector)
      this.mainProjector.moveTo(mainVals)
      if (
        !this.mainProjector.current_element.hiddenX ||
        !this.mainProjector.current_element.hiddenY
      ) {
        const controlPoint = this.mainProjector.getPoint(false)
        this.moveControlCircle(controlPoint)
      }

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY
    },
    onResize() {
      const svgRect = this.$refs['svg-main'].getBoundingClientRect()
      //this.scaleFactor = 1000 / Math.min(svgRect.width, svgRect.height)
      this.scaleFactor = Math.max(1000 / svgRect.width, 500 / svgRect.height)
      console.log('new scaleFactor:', this.scaleFactor)
    },
  },
}
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  /*display: inline-flex;*/
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  padding: 3rem;
}
</style>

<style>
#controlCircle {
  cursor: pointer;
}

#controlCircle:hover {
  filter: brightness(2);
}

#controlCircle.selected {
  stroke: yellow;
}
</style>
