<!-- azStorage/src/components/GetItems.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Items</h1>
    <div v-if="items.length">
      <ul>
        <li v-for="item in items" :key="item.id">{{ item.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const items = ref([]);
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  try {
    const { data } = await apiClient.getItems();
    items.value = data;
  } catch (error) {
    console.error('Failed to fetch items:', error);
    showPopup('Failed to fetch items.', 'error');
  }
});
</script>