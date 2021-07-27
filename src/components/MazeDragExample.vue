<template>
  <div class="fullscreen">
    <div class="maze-box" style="">
      <MazeSvg ref="reference-maze" width="100%" height="100%" />
    </div>
  </div>
</template>

<script>
import MazeSvg from '@/components/MazeSvg.vue'

export default {
  name: 'MazeDragExample',
  components: { MazeSvg },
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
</style>
