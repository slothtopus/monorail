<template>
  <div class="fullscreen">
    <div class="maze-box" style="">
      <MazeSvg ref="reference-maze" width="100%" height="100%" />
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
import preprocess from '@/lib/preprocess.js'

export default {
  name: 'MazeExample',
  data() {
    return {
      preprocessing: true,
    }
  },
  components: { MazeSvg },
  mounted() {
    this.preprocessing = true
    console.log('mounted')

    setTimeout(async () => {
      console.log('starting to process')
      await preprocess(
        this.$refs['reference-maze'].$el,
        this.$refs['scratch-maze']
      )
      console.log('processed')
      this.preprocessing = false
    }, 0)
  },
}
</script>

<style scoped>
.fullscreen {
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
}

.maze-box {
  width: 50%;
  height: 100%;
  display: inline-flex;
  justify-content: center;
  align-items: center;
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
</style>
