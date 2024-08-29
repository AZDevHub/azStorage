<!-- azStorage/src/components/GetItemRelationships.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Relationships</h1>
    <div v-if="relationships.length">
      <ul>
        <li v-for="relationship in relationships" :key="relationship.id">{{ relationship.name }}</li>
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

const relationships = ref([]);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemRelationships(guid);
    relationships.value = data;
  } catch (error) {
    console.error('Failed to fetch relationships:', error);
    showPopup('Failed to fetch relationships.', 'error');
  }
});
</script>