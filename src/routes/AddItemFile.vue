<!-- azStorage/src/components/AddItemFile.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Add Item File</h1>
    <input v-model.trim="fileName" placeholder="File Name" class="text-input" />
    <button @click="addItemFile" class="button">Add File</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const fileName = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const addItemFile = async () => {
  try {
    await apiClient.addItemFile({ name: fileName.value });
    showPopup('File added successfully!', 'success');
  } catch (error) {
    console.error('Failed to add file:', error);
    showPopup('Failed to add file.', 'error');
  }
};
</script>