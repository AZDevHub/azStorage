<!-- azStorage/src/components/DeleteItemFile.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Delete Item File</h1>
    <input v-model.trim="fileId" placeholder="File ID" class="text-input" />
    <button @click="deleteItemFile" class="button">Delete File</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const fileId = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const deleteItemFile = async () => {
  try {
    await apiClient.deleteItemFile(fileId.value);
    showPopup('File deleted successfully!', 'success');
  } catch (error) {
    console.error('Failed to delete file:', error);
    showPopup('Failed to delete file.', 'error');
  }
};
</script>