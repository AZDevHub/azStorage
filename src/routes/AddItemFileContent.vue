<!-- azStorage/src/components/AddItemFileContent.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Add Item File Content</h1>
    <textarea v-model="content" placeholder="File Content" class="text-input"></textarea>
    <button @click="addItemFileContent" class="button">Add Content</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const content = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const addItemFileContent = async () => {
  try {
    await apiClient.addItemFileContent({ content: content.value });
    showPopup('File content added successfully!', 'success');
  } catch (error) {
    console.error('Failed to add file content:', error);
    showPopup('Failed to add file content.', 'error');
  }
};
</script>