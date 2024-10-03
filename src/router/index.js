import { createRouter, createWebHashHistory } from 'vue-router'

//import MazePreprocessExample from '@/components/MazePreprocessExample.vue'
import MazePreprocess from '@/views/MazePreprocess.vue'
//import MazeDragExample from '@/components/MazeDragExample.vue'
import MazeDrag from '@/views/MazeDrag.vue'
import HiddenPathsExample from '@/components/HiddenPathsExample.vue'
import SpinningDiscExample from '@/components/SpinningDiscExample.vue'
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
    name: 'HiddenPathsExample',
    component: HiddenPathsExample,
  },
  {
    path: '/disc',
    name: 'SpinningDiscExample',
    component: SpinningDiscExample,
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
