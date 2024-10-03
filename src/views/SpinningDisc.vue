<template>
  <ExampleTemplate>
    <SpinningDiscExample />
    <template v-slot:instructions>
      <p>Click the discs and give them a spin.</p>
      <p>
        These are a couple of ideas with projecting moves onto paths (this time
        circles) to make more natural feeling controls.
      </p>
    </template>
  </ExampleTemplate>
</template>

<script>
import SpinningDiscExample from '@/components/SpinningDiscExample.vue'
import ExampleTemplate from './ExampleTemplate.vue'
export default {
  components: { ExampleTemplate, SpinningDiscExample },
}
</script>

<style scoped></style>
