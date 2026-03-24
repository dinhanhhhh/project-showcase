import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/home/index.vue'
import { usePagesStore } from '@/stores/usePagesStore'
import { buildAppRoutes } from './routes'

const modules = import.meta.glob('../views/**/index.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home', component: HomeView }, ...buildAppRoutes(modules)],
})

router.afterEach((to) => {
  const slug = typeof to.meta.slug === 'string' ? to.meta.slug : null
  if (!slug) return

  const store = usePagesStore()
  store.trackRecentlyViewed(slug)
})

export default router
