<template>
  <div class="wrapper">
    <div class="bezier-box" style="">
      <BezierPathSvg
        id="reference-bezier"
        ref="reference-bezier"
        width="100%"
        height="100%"
      />
    </div>
  </div>
  <div class="instructions">
    <p>Click the circles to drag the point along the path.</p>
    <p>
      The green line shows the red vector projected along the curve. A similar
      projection technique is used to determine the movement of the grey point
      along the line when dragged with the mouse.
    </p>
  </div>
</template>

<script>
import { preprocess } from '@/lib/preprocess.js'
import { Projector } from '@/lib/projection.js'
import BezierPathSvg from './BezierPathSvg.vue'

export default {
  name: 'BezierDragExample',
  components: { BezierPathSvg },
  data() {
    return {
      preprocessing: true,
      projector: new Projector(),
      movePoint: undefined,
      vectorPoint: undefined,
      vectorLine: undefined,
      projectedPath: undefined,
      mouse_x: undefined,
      mouse_y: undefined,
      moveBuffer: [],
      debugFlag: false,
    }
  },
  mounted() {
    this.preprocessing = true

    setTimeout(async () => {
      console.log('starting to process')
      let elements = await preprocess(this.$refs['reference-bezier'].$el, true)
      console.log('processed', elements.length, 'elements')
      this.preprocessing = false

      elements.forEach((e) => this.projector.addElement(e))
      this.projector.setCurrentElement(this.projector.elements[0])
      const point = this.projector.getPoint()
      console.log(point)
      this.addControls(point.x, point.y)
      this.updateProjectedMove()
    }, 0)
  },
  methods: {
    debug() {
      this.debugFlag = true
    },
    addControls(x, y) {
      const svgElem = this.$refs['reference-bezier'].$el

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      elem.id = 'projectedPath'
      svgElem.appendChild(elem)
      this.projectedPath = elem

      let elem = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      elem.setAttribute('x1', x)
      elem.setAttribute('y1', y)
      elem.setAttribute('x2', x + 10)
      elem.setAttribute('y2', y - 10)
      elem.setAttribute('stroke', 'red')
      elem.id = 'vectorLine'
      svgElem.appendChild(elem)
      this.vectorLine = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x)
      elem.setAttribute('cy', y)
      elem.setAttribute('r', 0.75)
      elem.setAttribute('fill', 'grey')
      elem.id = 'movePoint'
      svgElem.appendChild(elem)
      this.movePoint = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x + 10)
      elem.setAttribute('cy', y - 10)
      elem.setAttribute('r', 0.75)
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
      const moveVector = this.getMoveVector(event)

      if (moveVector.x == 0 && moveVector.y == 0) return

      this.bufferMoveTimed(moveVector)
      const expMoveVector = this.getExponentialMoveVec()

      const vals = this.projector.getMove(expMoveVector)
      this.projector.moveTo(vals)
      const new_point = this.projector.getPoint()

      this.updateMovePoint(new_point.x, new_point.y)
      this.updateProjectedMove()
    },

    vectorPointMousemove(event) {
      const moveVector = this.getMoveVector(event)

      if (moveVector.x == 0 && moveVector.y == 0) return

      this.updateVectorPoint(moveVector.x, moveVector.y)

      this.updateProjectedMove()
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
        0,
        79.375
      )
      const y = this.clamp(
        +this.vectorPoint.getAttribute('cy') + y_delta,
        0,
        26.458
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

    getMoveVector(event) {
      const svgElement = this.$refs['reference-bezier'].$el

      const { x: clientX, y: clientY } = this.convertScreenCoordsToSVG(
        svgElement,
        event.clientX,
        event.clientY
      )
      const { x: mouse_x, y: mouse_y } = this.convertScreenCoordsToSVG(
        svgElement,
        this.mouse_x,
        this.mouse_y
      )

      const moveVector = {
        x: clientX - mouse_x,
        y: clientY - mouse_y,
      }

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY

      return moveVector
    },
    convertScreenCoordsToSVG(svgElement, x, y) {
      // Get the transformation matrix for the SVG element
      var svgPoint = svgElement.createSVGPoint()

      // Set the point to the screen coordinates
      svgPoint.x = x
      svgPoint.y = y

      // Convert the point to SVG coordinates using the matrix
      var svgCoords = svgPoint.matrixTransform(
        svgElement.getScreenCTM().inverse()
      )

      return { x: svgCoords.x, y: svgCoords.y }
    },
  },
}
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
}

.bezier-box {
  width: 100%;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  padding: 3rem;
}

.instructions {
  padding: 1rem;
  text-align: justify;
  max-width: 35rem;
  margin: 0 auto;
}
</style>

<style>
#reference-bezier #movePoint {
  cursor: pointer;
  stroke-width: 0.15;
}

#reference-bezier #movePoint:hover {
  filter: brightness(1.4);
}

#reference-bezier #movePoint.selected {
  filter: brightness(1.4);
  stroke: yellow;
}

#reference-bezier #vectorPoint {
  cursor: pointer;
  stroke-width: 0.15;
}

#reference-bezier #vectorPoint:hover {
  filter: brightness(2);
}

#reference-bezier #vectorLine {
  stroke-width: 0.15;
}

#reference-bezier #vectorPoint.selected {
  filter: brightness(1.4);
  stroke: yellow;
}

#reference-bezier #projectedPath {
  fill: none;
  stroke: greenyellow;
  stroke-width: 0.5;
  stroke-linecap: square;
}
</style>
