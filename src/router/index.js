import { createRouter, createWebHistory } from 'vue-router'

import MazePreprocessExample from '@/components/MazePreprocessExample.vue'
import MazeDragExample from '@/components/MazeDragExample.vue'
import HiddenPathsExample from '@/components/HiddenPathsExample.vue'
import SpinningDiscExample from '@/components/SpinningDiscExample.vue'
import BezierDragExample from '../components/BezierDragExample.vue'

const routes = [
  {
    path: '/preprocess',
    name: 'MazePreprocessExample',
    component: MazePreprocessExample,
  },
  {
    path: '/drag',
    name: 'MazeDragExample',
    component: MazeDragExample,
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
    name: 'BezierDragExample',
    component: BezierDragExample,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
