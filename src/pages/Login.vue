<template>
  <div class="flex items-center justify-center min-h-screen bg-white">
    <div class="text-center">
      <div class="mb-8">
        <span class="material-icons text-6xl text-blue-500">cloud</span>
        <h1 class="text-3xl font-bold text-gray-800 mt-4">LiteDrive</h1>
        <p class="text-gray-600 mt-2">軽量クラウドストレージ</p>
      </div>
      <button 
        @click="handleSignIn"
        class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto transition"
      >
        <span class="material-icons">login</span>
        ログイン
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['change-page'])
const { signIn, clerk } = useAuth()

const handleSignIn = async () => {
  await signIn()
  clerk.value.addListener((event) => {
    if (event.user) {
      emit('change-page', 'home')
    }
  })
}
</script>