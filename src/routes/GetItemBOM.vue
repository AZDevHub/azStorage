<!-- azStorage/src/components/GetItemBOM.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item BOM</h1>
    <div v-if="bom.length">
      <ul>
        <li v-for="part in bom" :key="part.id">{{ part.name }}</li>
      </ul>
    </div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const bom = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemBOM(guid);
    bom.value = data;
  } catch (error) {
    console.error('Failed to fetch BOM:', error);
    showPopup('Failed to fetch BOM.', 'error');
  }
});
</script>