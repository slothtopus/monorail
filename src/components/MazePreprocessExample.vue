<template>
  <div class="container">
    <div class="maze-box" style="">
      <MazeSvg
        id="original-maze"
        ref="original-maze"
        width="100%"
        height="100%"
      />
    </div>
    <div class="maze-box">
      <div class="loading-box" :class="{ hide: !preprocessing }">
        <p>Processing</p>
      </div>
      <svg
        id="scratch-maze"
        ref="scratch-maze"
        width="100%"
        height="100%"
        viewBox="-6 -6 255 255"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        :class="preprocessing ? 'hide' : 'show'"
      ></svg>
    </div>
  </div>
</template>

<script>
import MazeSvg from '@/components/MazeSvg.vue'
import { preprocess } from '@/lib/preprocess.js'
import { Line, CubicBezier } from '@/lib/elements.js'

export default {
  name: 'MazePreprocessExample',
  data() {
    return {
      preprocessing: true,
      colours: [
        '#a6cee3',
        '#1f78b4',
        '#b2df8a',
        '#33a02c',
        '#fb9a99',
        '#e31a1c',
        '#fdbf6f',
        '#ff7f00',
        '#cab2d6',
        '#6a3d9a',
        '#ffff99',
        '#b15928',
      ],
      colour_i: 0,
    }
  },
  components: { MazeSvg },
  mounted() {
    this.preprocessing = true
    console.log('mounted')
    this.colourOriginal()

    setTimeout(async () => {
      console.log('starting to process')
      let elements = await preprocess(this.$refs['original-maze'].$el)
      console.log('processed', elements.length, 'elements')
      this.preprocessing = false
      this.drawAllElements(elements)
    }, 0)
  },
  methods: {
    colourOriginal() {
      console.log('colourOriginal')
      debugger
      for (const childElem of this.$refs['original-maze'].$el.children) {
        childElem.setAttribute('stroke', this.getColour())
        console.log(childElem)
      }
    },
    getColour() {
      const col = this.colours[this.colour_i]
      this.colour_i = (this.colour_i + 1) % this.colours.length
      return col
    },
    drawAllElements(elements) {
      elements.forEach((e) => {
        //if (e.type == 'line') this.drawLine(e, this.getColour())
        //if (e.type == 'cubic') this.drawPath(e, this.getColour())
        if (e instanceof Line) this.drawLine(e, this.getColour())
        if (e instanceof CubicBezier) this.drawPath(e, this.getColour())
      })
    },
    drawPath(d, stroke) {
      const svgElem = this.$refs['scratch-maze']
      const pathElem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )
      pathElem.setAttribute(
        'd',
        `M ${d.p1.x},${d.p1.y} C ${d.c1.x},${d.c1.y} ${d.c2.x},${d.c2.y} ${d.p2.x},${d.p2.y}`
      )
      pathElem.setAttribute('stroke', stroke)
      pathElem.setAttribute('fill', 'none')
      svgElem.appendChild(pathElem)
    },
    drawLine(vals, stroke) {
      const svgElem = this.$refs['scratch-maze']
      const pathElem = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      )
      pathElem.setAttribute('x1', vals.p1.x)
      pathElem.setAttribute('y1', vals.p1.y)
      pathElem.setAttribute('x2', vals.p2.x)
      pathElem.setAttribute('y2', vals.p2.y)

      pathElem.setAttribute('stroke', stroke)
      pathElem.setAttribute('fill', 'none')
      svgElem.appendChild(pathElem)
    },
  },
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  height: 100%;
  padding: 1rem;
}

.maze-box {
  height: 100%;
  position: relative;
}

#scratch-maze {
  stroke-width: 2;
  stroke-linecap: square;
  transition: opacity 2s;
  opacity: 0;
}

#scratch-maze.show {
  opacity: 1;
}

.loading-box {
  position: absolute;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 1;
  transition: opacity 1s;
}

.loading-box.hide {
  opacity: 0;
}

#original-maze {
  stroke-width: 2;
}
</style>
