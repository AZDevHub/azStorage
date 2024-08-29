<!-- azStorage/src/components/GetItemRequirements.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Requirements</h1>
    <div v-if="requirements.length">
      <ul>
        <li v-for="requirement in requirements" :key="requirement.id">{{ requirement.description }}</li>
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


const requirements = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemRequirements(guid);
    requirements.value = data;
  } catch (error) {
    console.error('Failed to fetch requirements:', error);
    showPopup('Failed to fetch requirements.', 'error');
  }
});
</script>