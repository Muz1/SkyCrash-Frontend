import { createRouter, createWebHistory } from 'vue-router'
import WelcomePage from '../pages/WelcomePage.vue'
import SignInPage from '../pages/SignInPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import GameLobbyPage from '../pages/GameLobbyPage.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: WelcomePage,
  },
  {
    path: '/sign-in',
    name: 'SignIn',
    component: SignInPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
  },
  {
    path: '/game-lobby',
    name: 'GameLobby',
    component: GameLobbyPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
