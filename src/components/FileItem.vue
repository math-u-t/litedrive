<template>
  <li class="p-4 hover:bg-gray-50 transition" :class="{ 'opacity-50': deleting }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <span class="material-icons text-gray-500">{{ getFileIcon(file.mimeType) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-800 truncate">{{ file.fileName }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(file.fileSize) }} • {{ formatDate(file.createdAt) }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a 
          :href="file.url" 
          target="_blank"
          class="text-blue-500 hover:text-blue-700 transition"
          :class="{ 'pointer-events-none': deleting }"
        >
          <span class="material-icons">download</span>
        </a>
        <button 
          @click="confirmDelete"
          class="text-red-500 hover:text-red-700 transition"
          :disabled="deleting"
        >
          <span class="material-icons">{{ deleting ? 'hourglass_empty' : 'delete' }}</span>
        </button>
      </div>
    </div>
  </li>
</template>

<script setup>
const props = defineProps({
  file: Object,
  deleting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['delete'])

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'insert_drive_file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'videocam'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'folder_zip'
  return 'insert_drive_file'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const confirmDelete = () => {
  if (props.deleting) return
  
  if (confirm(`「${props.file.fileName}」を削除しますか?`)) {
    emit('delete', props.file._id)
  }
}
</script>