<!-- azStorage/src/components/GetItemRevisions.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Revisions</h1>
    <div v-if="revisions.length">
      <ul>
        <li v-for="revision in revisions" :key="revision.id">{{ revision.version }}</li>
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


const revisions = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemRevisions(guid);
    revisions.value = data;
  } catch (error) {
    console.error('Failed to fetch revisions:', error);
    showPopup('Failed to fetch revisions.', 'error');
  }
});
</script>