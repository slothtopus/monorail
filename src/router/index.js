import { createRouter, createWebHashHistory } from 'vue-router'

import MazePreprocess from '@/views/MazePreprocess.vue'
import MazeDrag from '@/views/MazeDrag.vue'
import HiddenPaths from '@/views/HiddenPaths.vue'
import SpinningDisc from '@/views/SpinningDisc.vue'
import BezierDrag from '@/views/BezierDrag.vue'

const routes = [
  {
    path: '/preprocess',
    name: 'MazePreprocess',
    component: MazePreprocess,
  },
  {
    path: '/drag',
    name: 'MazeDrag',
    component: MazeDrag,
  },
  {
    path: '/hidden',
    name: 'HiddenPaths',
    component: HiddenPaths,
  },
  {
    path: '/disc',
    name: 'SpinningDisc',
    component: SpinningDisc,
  },
  {
    path: '/bezier',
    name: 'BezierDrag',
    component: BezierDrag,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
