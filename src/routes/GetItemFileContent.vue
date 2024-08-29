<!-- azStorage/src/components/GetItemFileContent.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item File Content</h1>
    <div v-if="fileContent">{{ fileContent }}</div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const fileContent = ref('');
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const { guid, fileguid } = route.params;
  try {
    const { data } = await apiClient.getItemFileContent(guid, fileguid);
    fileContent.value = data;
  } catch (error) {
    console.error('Failed to fetch file content:', error);
    showPopup('Failed to fetch file content.', 'error');
  }
});
</script>