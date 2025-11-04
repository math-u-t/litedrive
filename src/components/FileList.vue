<template>
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-800">ファイル一覧</h2>
    </div>
    
    <div v-if="loading" class="p-8 text-center text-gray-500">
      読み込み中...
    </div>

    <div v-else-if="error" class="p-8 text-center text-red-500">
      {{ error }}
    </div>

    <div v-else-if="files.length === 0" class="p-8 text-center text-gray-500">
      ファイルがありません
    </div>

    <ul v-else class="divide-y divide-gray-200">
      <FileItem 
        v-for="file in files" 
        :key="file._id"
        :file="file"
        :deleting="deletingFiles.has(file._id)"
        @delete="handleDelete"
      />
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import FileItem from './FileItem.vue'

const { user } = useAuth()
const files = ref([])
const loading = ref(true)
const error = ref('')
const deletingFiles = ref(new Set())

const loadFiles = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`/api/list?userId=${user.value.id}`)
    
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'ファイルの取得に失敗しました')
    }
    
    files.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const handleDelete = async (fileId) => {
  // 既に削除中の場合は無視
  if (deletingFiles.value.has(fileId)) {
    return
  }

  deletingFiles.value.add(fileId)
  
  try {
    const response = await fetch('/api/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        userId: user.value.id
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || '削除に失敗しました')
    }

    await loadFiles()
  } catch (err) {
    error.value = err.message
  } finally {
    deletingFiles.value.delete(fileId)
  }
}

onMounted(() => {
  loadFiles()
})
</script>