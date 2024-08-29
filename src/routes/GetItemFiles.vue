<!-- azStorage/src/components/GetItemFiles.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Files</h1>
    <div v-if="files.length">
      <ul>
        <li v-for="file in files" :key="file.id">{{ file.name }}</li>
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


const files = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemFiles(guid);
    files.value = data;
  } catch (error) {
    console.error('Failed to fetch item files:', error);
    showPopup('Failed to fetch item files.', 'error');
  }
});
</script>