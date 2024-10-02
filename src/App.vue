<template>
  <div class="fullscreen">
    <div class="nav-box">
      <router-link to="/bezier">Bezier dragging</router-link>
      <router-link to="/preprocess">Maze preprocessing</router-link>
      <router-link to="/drag">Maze dragging</router-link>
      <router-link to="/hidden">Hidden paths</router-link>
      <router-link to="/disc">Spinning disc</router-link>
    </div>
    <div class="content-box">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
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

.nav-box {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  height: 5em;
}

.content-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: calc(100% - 5em);
}

.nav-box .router-link-exact-active {
  color: yellow;
}

.nav-box a {
  color: white;
}

.fullscreen {
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
}
</style>
