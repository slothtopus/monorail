<template>
  <div class="container">
    <div class="disc-box">
      <CelticDiscSvg
        id="disc1"
        ref="disc1"
        width="100%"
        height="100%"
        :angle="disc1.baseAngle + disc1.angleDelta"
      />
    </div>
    <div class="disc-box">
      <CelticDiscSvg
        id="disc2"
        ref="disc2"
        width="100%"
        height="100%"
        :angle="disc2.baseAngle + disc2.angleDelta"
      />
    </div>
  </div>
</template>

<script>
import { Projector } from '@/lib/projection.js'
import { CubicBezier } from '@/lib/elements.js'
import { subtractVector, vectorLength } from '@/lib/vector.js'

import CelticDiscSvg from '@/components/CelticDiscSvg.vue'

export default {
  name: 'SpinningDiscExample',
  components: { CelticDiscSvg },
  data() {
    return {
      mouse_x: undefined,
      mouse_y: undefined,

      disc1: {
        id: 'disc1',
        projector: undefined,
        guidePoint: undefined,
        guidePath: [],
        baseAngle: 0,
        angleDelta: 0,
        startAngle: 0,
      },
      disc2: {
        id: 'disc2',
        projector: undefined,
        guidePoint: undefined,
        guidePath: [],
        baseAngle: 0,
        angleDelta: 0,
        startAngle: 0,
      },
    }
  },

  mounted() {
    document
      .getElementById('disc1')
      .addEventListener(
        'mousedown',
        this.mouseHandler.bind(
          this,
          this.circleClick.bind(this, this.disc1),
          this.circleMove.bind(this, this.disc1),
          this.circleEnd.bind(this, this.disc1)
        )
      )

    document
      .getElementById('disc2')
      .addEventListener(
        'mousedown',
        this.mouseHandler.bind(
          this,
          this.circleClick.bind(this, this.disc2),
          this.circleMove.bind(this, this.disc2),
          this.circleEnd.bind(this, this.disc2)
        )
      )
  },
  methods: {
    setupCircle(discVals, clickPoint) {
      const circleCentre = { x: 100, y: 100 }
      const svgElem = this.$refs[discVals.id].$el
      discVals.projector = new Projector()

      let d
      if (discVals.id == 'disc1') {
        d = this.buildCirclePath(98, circleCentre.x, circleCentre.y)
      } else {
        let r = vectorLength(subtractVector(clickPoint, circleCentre))
        r = Math.min(Math.max(15, r), 98)
        d = this.buildCirclePath(r, circleCentre.x, circleCentre.y)
      }

      d.forEach((d) => {
        const pathElem = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'path'
        )
        pathElem.setAttribute(
          'd',
          `M${d[0].x},${d[0].y} C${d[1].x},${d[1].y} ${d[2].x},${d[2].y} ${d[3].x},${d[3].y}`
        )
        pathElem.setAttribute('class', 'guide-circle')
        svgElem.appendChild(pathElem)
        discVals.guidePath.push(pathElem)

        const bezier = new CubicBezier({
          p1: d[0],
          c1: d[1],
          c2: d[2],
          p2: d[3],
        })
        discVals.projector.addElement(bezier, false)
      })
      discVals.projector.setCurrentElement(discVals.projector.elements[0])
    },
    buildCirclePath(r, cx, cy) {
      // Magic k value from
      // https://pomax.github.io/bezierinfo/#circles_cubic
      const k = (4 / 3) * Math.tan(Math.PI / 8)
      let p1 = { x: r, y: 0 }
      let c1 = { x: r, y: k * r }
      let c2 = { x: k * r, y: r }
      let p2 = { x: 0, y: r }

      const rotate90 = (p) => {
        return {
          x: -p.y,
          y: p.x,
        }
      }

      let arc = [p1, c1, c2, p2]
      let arcs = []
      arcs.push(arc)
      for (let i = 0; i < 3; i++) {
        arc = [...arc].map((x) => rotate90(x))
        arcs.push(arc)
      }

      const translate = (arc, x, y) => {
        return arc.map((p) => {
          return { x: p.x + x, y: p.y + y }
        })
      }

      return arcs.map((a) => translate(a, cx, cy))
    },
    mouseHandler(
      mouseClickHandler,
      mousemoveHandler,
      extraMouseUpHandler,
      event
    ) {
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
        extraMouseUpHandler()
      }

      mouseClickHandler(event)
      document.addEventListener('mousemove', mousemoveHandler)
      document.addEventListener('mouseup', mouseupHandler)
    },
    circleClick(discVals, event) {
      console.log('adding circle')

      const pt = this.mapScreenCoordsToSvg(
        { x: event.pageX, y: event.pageY },
        this.$refs[discVals.id].$el
      )
      this.setupCircle(discVals, pt)

      const projected = discVals.projector.projectPoint(pt)
      discVals.projector.setCurrentElement(projected.element)
      discVals.projector.t = projected.t

      const circleElem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      )
      circleElem.setAttribute('r', 3)
      circleElem.setAttribute('cx', projected.x)
      circleElem.setAttribute('cy', projected.y)
      circleElem.setAttribute('id', 'circle-point')
      this.$refs[discVals.id].$el.appendChild(circleElem)
      discVals.guidePoint = circleElem

      const startPoint = subtractVector(projected, { x: 100, y: 100 })
      discVals.startAngle =
        Math.atan2(startPoint.x, startPoint.y) * (180 / Math.PI)
    },
    circleMove(discVals, event) {
      const moveVector = subtractVector(
        this.mapScreenCoordsToSvg(
          { x: event.clientX, y: event.clientY },
          this.$refs[discVals.id].$el
        ),
        this.mapScreenCoordsToSvg(
          { x: this.mouse_x, y: this.mouse_y },
          this.$refs[discVals.id].$el
        )
      )

      if (moveVector.x == 0 && moveVector.y == 0) return
      const vals = discVals.projector.getMove(moveVector)
      discVals.projector.moveTo(vals)
      const newPoint = discVals.projector.getPoint()
      discVals.guidePoint.setAttribute('cx', newPoint.x)
      discVals.guidePoint.setAttribute('cy', newPoint.y)

      const newAnglePoint = subtractVector(newPoint, { x: 100, y: 100 })
      const newAngle =
        Math.atan2(newAnglePoint.x, newAnglePoint.y) * (180 / Math.PI)
      discVals.angleDelta = discVals.startAngle - newAngle

      this.mouse_x = event.clientX
      this.mouse_y = event.clientY
    },
    circleEnd(discVals) {
      console.log('removing circle')
      discVals.guidePoint.remove()
      discVals.guidePoint = undefined
      discVals.guidePath.forEach((p) => p.remove())
      discVals.guidePath = []
      discVals.baseAngle += discVals.angleDelta
      discVals.angleDelta = 0
      discVals.projector = undefined
    },
    mapScreenCoordsToSvg(point, svgElem) {
      let pt = svgElem.createSVGPoint()
      pt.x = point.x
      pt.y = point.y
      pt = pt.matrixTransform(svgElem.getScreenCTM().inverse())
      return pt
    },
  },
}
</script>

<style>
.container {
  height: 100%;
  box-sizing: border-box;
  padding: 3rem;
}

.disc-box {
  width: 50%;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 1em;
  box-sizing: border-box;
}

.guide-circle {
  stroke: red;
  stroke-dasharray: 5;
  stroke-width: 1;
  fill: none;
}

#spinning-disc {
  fill: rgba(255, 0, 0, 0.3);
}

#circle-point {
  fill: yellowgreen;
}
</style>
