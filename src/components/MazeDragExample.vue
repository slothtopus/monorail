<template>
  <div class="maze-box">
    <MazeSvg id="reference-maze" ref="reference-maze" />
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
      elem.id = 'vectorLine'
      svgElem.appendChild(elem)
      this.vectorLine = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x)
      elem.setAttribute('cy', y)
      elem.setAttribute('r', 3.5)
      elem.id = 'movePoint'
      svgElem.appendChild(elem)
      this.movePoint = elem

      elem = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      elem.setAttribute('cx', x + 50)
      elem.setAttribute('cy', y - 50)
      elem.setAttribute('r', 3.5)
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
      console.log('getMove returns: ', vals)
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

    getMoveVector(event) {
      const svgElement = this.$refs['reference-maze'].$el

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
.maze-box {
  width: 100%;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  padding: 1rem;
}

#reference-maze {
  height: 100%;
}
</style>

<style>
#reference-maze line,
#reference-maze path {
  stroke: white;
}

#reference-maze #movePoint {
  cursor: pointer;
  fill: grey;
}

#reference-maze #movePoint:hover {
  filter: brightness(1.4);
}

#reference-maze #movePoint.selected {
  filter: brightness(1.4);
  stroke: yellow;
}

#reference-maze #vectorPoint {
  cursor: pointer;
  fill: red;
}

#reference-maze #vectorLine {
  stroke: red;
}

#reference-maze #vectorPoint:hover {
  filter: brightness(2);
}

#reference-maze #vectorPoint.selected {
  filter: brightness(1.4);
  stroke: yellow;
}

#reference-maze #projectedPath {
  fill: none;
  stroke: greenyellow;
  stroke-width: 3;
  stroke-linecap: square;
}
</style>
