<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <component :is="currentPage" @change-page="changePage" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import { useAuth } from './composables/useAuth'

const currentPage = ref(Login)
const { initClerk, isAuthenticated, clerk } = useAuth()

onMounted(async () => {
  await initClerk()
  
  // 認証状態の監視
  if (clerk.value) {
    clerk.value.addListener((state) => {
      if (state.user) {
        isAuthenticated.value = true
        currentPage.value = Home
      } else {
        isAuthenticated.value = false
        currentPage.value = Login
      }
    })
  }
  
  // 初期状態の確認
  if (isAuthenticated.value) {
    currentPage.value = Home
  }
})

const changePage = (page) => {
  currentPage.value = page === 'home' ? Home : Login
}
</script>