import { createRouter, createWebHashHistory } from 'vue-router'
import NotFound from './../routes/NotFound.vue'
import GoHome from './../routes/GoHome.vue'
import FileUpload from './../routes/FileUpload.vue'
import ListFiles from './../routes/ListFiles.vue'
import GetStatus from './../routes/GetStatus.vue'
import GetSas from './../routes/GetSas.vue'
import GetAbout from './../routes/GetAbout.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'GoHome', component: GoHome },
  { path: '/upload', name: 'FileUpload', component: FileUpload },
  { path: '/list', name: 'ListFiles', component: ListFiles },
  { path: '/status', name: 'GetStatus', component: GetStatus },
  { path: '/sas', name: 'GetSas', component: GetSas },
  { path: '/about', name: 'GetAbout', component: GetAbout },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
