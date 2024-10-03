<template>
  <ExampleTemplate>
    <MazeDragExample />
    <template v-slot:instructions>
      <p>Click the circles to drag the point along the path.</p>
      <p>
        The green line shows the red vector projected along the maze. A similar
        projection technique is used to determine the movement of the grey point
        along the line when dragged with the mouse.
      </p>
      <p>
        We still get a little stuck when dragging around the intersections, so
        not there yet.
      </p>
    </template>
  </ExampleTemplate>
</template>

<script>
import MazeDragExample from '@/components/MazeDragExample.vue'
import ExampleTemplate from './ExampleTemplate.vue'
export default {
  components: { ExampleTemplate, MazeDragExample },
}
</script>

<style scoped></style>
