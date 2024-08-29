<!-- azStorage/src/components/GetItemNumberFormats.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Number Formats</h1>
    <div v-if="numberFormats.length">
      <ul>
        <li v-for="format in numberFormats" :key="format.id">{{ format.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const numberFormats = ref([]);
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  try {
    const { data } = await apiClient.getItemNumberFormats();
    numberFormats.value = data;
  } catch (error) {
    console.error('Failed to fetch number formats:', error);
    showPopup('Failed to fetch number formats.', 'error');
  }
});
</script>