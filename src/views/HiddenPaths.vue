<template>
  <ExampleTemplate>
    <HiddenPathsExample />
    <template v-slot:instructions>
      <p>Click the green circle and get it through the gap.</p>
      <p>
        This is a quick example to show how we can control other attributes by
        constraining a drag along a path. Our drag path is at the bottom. The
        first and second line are translated into movement, but the middle line
        changes scale.
      </p>
    </template>
  </ExampleTemplate>
</template>

<script>
import HiddenPathsExample from '@/components/HiddenPathsExample.vue'
import ExampleTemplate from './ExampleTemplate.vue'
export default {
  components: { ExampleTemplate, HiddenPathsExample },
}
</script>

<style scoped></style>
