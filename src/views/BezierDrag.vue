<template>
  <ExampleTemplate>
    <BezierDragExample />
    <template v-slot:instructions>
      <p>Click the circles to drag the point along the path.</p>
      <p>
        The green line shows the red vector projected along the curve. A similar
        projection technique is used to determine the movement of the grey point
        along the line when dragged with the mouse.
      </p>
    </template>
  </ExampleTemplate>
</template>

<script>
import BezierDragExample from '@/components/BezierDragExample.vue'
import ExampleTemplate from './ExampleTemplate.vue'
export default {
  components: { ExampleTemplate, BezierDragExample },
}
</script>

<style scoped></style>
