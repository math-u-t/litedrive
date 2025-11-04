<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-500 text-3xl">cloud</span>
          <h1 class="text-xl font-bold text-gray-800">LiteDrive</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ user?.primaryEmailAddress?.emailAddress }}</span>
          <button 
            @click="handleSignOut"
            class="text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <span class="material-icons">logout</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <FileUploader @file-uploaded="refreshFileList" />
      <FileList :key="listKey" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import FileUploader from '../components/FileUploader.vue'
import FileList from '../components/FileList.vue'

const emit = defineEmits(['change-page'])
const { signOut, user } = useAuth()
const listKey = ref(0)

const handleSignOut = async () => {
  await signOut()
  emit('change-page', 'login')
}

const refreshFileList = () => {
  listKey.value++
}
</script>