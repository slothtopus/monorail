<template>
  <ExampleTemplate>
    <MazePreprocessExample />
    <template v-slot:instructions>
      <p>
        To drag across intersections, our technique requires that intersections
        lie only at the ends of paths. To get this nice maze to work as an
        example, we need to preprocess it first to split paths accordingly.
      </p>
      <p>
        This (unoptimised) algorithm converts all paths to cubic beziers and
        splits at intersections. Sometimes Arcs are split into multiple cubic
        beziers due to limitations to how curvey a bezier can be. This is why we
        see some random splits along curves as well.
      </p>
    </template>
  </ExampleTemplate>
</template>

<script>
import MazePreprocessExample from '@/components/MazePreprocessExample.vue'
import ExampleTemplate from './ExampleTemplate.vue'
export default {
  components: { ExampleTemplate, MazePreprocessExample },
}
</script>

<style scoped></style>
