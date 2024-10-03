<template>
  <div class="wrapper">
    <slot></slot>
    <div class="instructions"><slot name="instructions"></slot></div>
  </div>
</template>

<script>
export default {
  name: 'ExampleTemplate',
}
</script>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.instructions {
  padding: 1rem;
  text-align: justify;
  max-width: 35rem;
  margin: 0 auto;
}
</style>
