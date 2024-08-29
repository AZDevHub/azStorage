<!-- azStorage/src/components/GetItemCategories.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Categories</h1>
    <div v-if="categories.length">
      <ul>
        <li v-for="category in categories" :key="category.id">{{ category.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const categories = ref([]);
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  try {
    const { data } = await apiClient.getItemCategories();
    categories.value = data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    showPopup('Failed to fetch categories.', 'error');
  }
});
</script>