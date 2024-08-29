<!-- azStorage/src/components/GetItemAttributes.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Attributes</h1>
    <div v-if="attributes.length">
      <ul>
        <li v-for="attribute in attributes" :key="attribute.id">{{ attribute.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const attributes = ref([]);
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  try {
    const { data } = await apiClient.getItemAttributes();
    attributes.value = data;
  } catch (error) {
    console.error('Failed to fetch attributes:', error);
    showPopup('Failed to fetch attributes.', 'error');
  }
});
</script>