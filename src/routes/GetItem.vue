<!-- azStorage/src/components/GetItem.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Details</h1>
    <div v-if="item">{{ item.name }}</div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const item = ref(null);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const response = await apiClient.getItem(guid);
    if (response.status === 200) {
      item.value = response.data; // Assuming response.data is the item object
    }
  } catch (error) {
    console.error('Failed to fetch item:', error);
    showPopup('Failed to fetch item.', 'error');
  }
});
</script>