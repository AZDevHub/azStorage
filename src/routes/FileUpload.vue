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
import { ref, onMounted, watch } from 'vue'
import apiClient from '../services/ApiServices'
import ShowPopup from '../components/show-popup.vue'

const file = ref(null)
const containerName = ref('upload')
const isUploading = ref(false)
const fileInput = ref(null)
const popup = ref(null)

const selectFile = () => {
  fileInput.value.click()
}

const clearFile = () => {
  file.value = null
}

const showPopup = (message, type) => {
  popup.value.show(message, type)
}

const uploadFiles = async (event) => {
  file.value = event.target.files[0]
  if (!file.value) {
    showPopup('Please select a file.', 'error')
    return
  }
  isUploading.value = true
  showPopup('Uploading...', 'loading')
  for (const file of files) {
    try {
      const formData = new FormData();
      const uploadContainer = containerName.value || 'upload';
      formData.append('fileInput', file);
      const response = await apiClient.fileUpload(uploadContainer, formData);
      console.log('File uploaded:', response.data);
    } catch (error) {
      console.error('Failed to upload file:', error);
      showPopup(`Failed to upload ${file.name}. Please try again.`, 'error');
    }
  }
}
//onMounted(() => {
//  watch(file, (newVal) => {
//    if (newVal) {
//      uploadFile()
//    }
//  })
//})
</script>
