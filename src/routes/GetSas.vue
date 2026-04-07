<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Generate SAS Token</h1>
    <input v-model.trim="fileName" placeholder="File Name" />
    <p>
      Permissions:
      <select v-model="permissions">
        <option value="r">Read</option>
        <option value="w">Write</option>
        <option value="d">Delete</option>
      </select>
    </p>
    <button :disabled="!isValid()" class="button" @click="generateSasToken">Generate</button>
    <div v-if="sasUrl">SAS URL: {{ sasUrl }}</div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue'
import apiClient from '../services/ApiServices'
import ShowPopup from '../components/show-popup.vue'

const containerName = 'upload'
const fileName = ref('')
const permissions = ref('r')
const sasUrl = ref('')
const popup = ref(null)

const isValid = () => fileName.value
const showPopup = (message, type) => {
  popup.value.show(message, type)
}
const generateSasToken = async () => {
  if (!isValid() || !permissions.value) {
    showPopup('Please enter valid values.', 'error')
    return
  }
  showPopup('Generating...', 'loading')
  try {
    const { data } = await apiClient.getSASUrl(containerName, fileName.value, permissions.value)
    sasUrl.value = data
    showPopup('SAS URL generated successfully.', 'success')
  } catch (error) {
    console.error('There was an error fetching the data:', error)
    showPopup('Failed to generate SAS URL. Please try again.', 'error')
  }
}
</script>
