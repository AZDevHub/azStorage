<!-- azStorage/src/components/GetFileCategories.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">File Categories</h1>
    <div v-if="fileCategories.length">
      <ul>
        <li v-for="category in fileCategories" :key="category.id">{{ category.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const fileCategories = ref([]);
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  try {
    const { data } = await apiClient.getFileCategories();
    fileCategories.value = data;
  } catch (error) {
    console.error('Failed to fetch file categories:', error);
    showPopup('Failed to fetch file categories.', 'error');
  }
});
</script>