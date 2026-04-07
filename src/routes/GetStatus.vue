<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">API Status</h1>
    <div v-if="apiStatus">Status: {{ apiStatus }}</div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue'
import apiClient from '../services/ApiServices'
import ShowPopup from '../components/show-popup.vue'

const apiStatus = ref(null)
const popup = ref(null)

const showPopup = (msg, msgType) => {
  popup.value.show(msg, msgType)
}

onMounted(async () => {
  try {
    const { data } = await apiClient.getStatus()
    apiStatus.value = data ?? 'Invalid response from API'
  } catch (error) {
    console.error(error)
    showPopup('Error: Unable to fetch API status', 'error')
    apiStatus.value = 'API Offline'
  }
})
</script>
