<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Upload File</h1>
    <div>
      <input
        class="hidden"
        id="upload"
        type="file"
        @change="uploadFiles"
        ref="fileInput"
        multiple
        required
      />
      <button class="button" @click="selectFile" :disabled="isUploading">Upload</button>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue'
import apiClient from '../services/ApiServices'
import ShowPopup from '../components/show-popup.vue'

const containerName = ref('upload')
const isUploading = ref(false)
const fileInput = ref(null)
const popup = ref(null)

const selectFile = () => {
  fileInput.value.click()
}

const showPopup = (message, type) => {
  popup.value.show(message, type)
}

const uploadFiles = async (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) {
    showPopup('Please select a file.', 'error')
    return
  }
  const numFiles = files.length
  isUploading.value = true
  showPopup('Uploading...', 'loading')

      const uploadContainer = containerName.value || 'upload'

  for (const file of files) {
      try {
      const response = await apiClient.fileUpload(uploadContainer, file)
      showPopup(`File ${file.name} uploaded successfully.`, 'success')
    } catch (error) {
      console.error('Failed to upload file:', error)
      showPopup(`Failed to upload ${file.name}.`, 'error')
      }
    }
  // Clear the input field to allow re-uploading the same file
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  isUploading.value = false
}
</script>
