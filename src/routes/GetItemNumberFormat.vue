<!-- azStorage/src/components/GetItemNumberFormat.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Item Number Format</h1>
    <div v-if="numberFormat">{{ numberFormat.name }}</div>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const numberFormat = ref(null);
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

onMounted(async () => {
  const guid = route.params.guid;
  try {
    const { data } = await apiClient.getItemNumberFormat(guid);
    numberFormat.value = data;
  } catch (error) {
    console.error('Failed to fetch number format:', error);
    showPopup('Failed to fetch number format.', 'error');
  }
});
</script>