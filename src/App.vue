<template>
  <MazeExample />
</template>

<script>
import MazeExample from '@/components/MazeExample.vue'
export default {
  name: 'App',
  components: { MazeExample },
}
</script>

<style>
body {
  width: 100%;
  height: 100%;
  background-color: #003745;
  color: white;
  margin: 0px;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
