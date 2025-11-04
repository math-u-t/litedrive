<template>
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <label 
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
      :class="{ 'opacity-50 cursor-not-allowed': uploading }"
    >
      <span class="material-icons text-6xl text-gray-400 mb-2">cloud_upload</span>
      <span class="text-gray-600">{{ uploading ? 'アップロード中...' : 'ファイルを選択' }}</span>
      <span class="text-xs text-gray-500 mt-2">最大10MB</span>
      <input 
        type="file" 
        class="hidden" 
        @change="handleFileSelect"
        :disabled="uploading"
      />
    </label>
    <div v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</div>
    <div v-if="success" class="mt-4 text-green-500 text-sm">{{ success }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const emit = defineEmits(['file-uploaded'])
const { user } = useAuth()
const uploading = ref(false)
const error = ref('')
const success = ref('')

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  error.value = ''
  success.value = ''

  // クライアント側でサイズチェック
  if (file.size > MAX_SIZE) {
    error.value = 'ファイルサイズが大きすぎます（最大10MB）'
    event.target.value = ''
    return
  }

  uploading.value = true

  try {
    const reader = new FileReader()
    
    reader.onload = async () => {
      try {
        const base64Data = reader.result.split(',')[1]
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            userId: user.value.id,
            fileSize: file.size,
            mimeType: file.type
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'アップロードに失敗しました')
        }

        success.value = 'アップロード成功'
        emit('file-uploaded')
        event.target.value = ''
        
        // 成功メッセージを3秒後に消す
        setTimeout(() => {
          success.value = ''
        }, 3000)
      } catch (err) {
        error.value = err.message
      } finally {
        uploading.value = false
      }
    }

    reader.onerror = () => {
      error.value = 'ファイルの読み込みに失敗しました'
      uploading.value = false
    }

    reader.readAsDataURL(file)
  } catch (err) {
    error.value = err.message
    uploading.value = false
  }
}
</script>