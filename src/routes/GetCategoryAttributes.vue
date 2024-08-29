<!-- azStorage/src/components/GetCategoryAttributes.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Category Attributes</h1>
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
import { useRoute } from 'vue-router';

import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const attributes = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getCategoryAttributes(guid);
    attributes.value = data;
  } catch (error) {
    console.error('Failed to fetch category attributes:', error);
    showPopup('Failed to fetch category attributes.', 'error');
  }
});
</script>