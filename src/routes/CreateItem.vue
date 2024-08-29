<!-- azStorage/src/components/CreateItem.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Create Item</h1>
    <input v-model.trim="itemName" placeholder="Item Name" class="text-input" />
    <button @click="createItem" class="button">Create</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const itemName = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const createItem = async () => {
  try {
    await apiClient.createItem({ name: itemName.value });
    showPopup('Item created successfully!', 'success');
  } catch (error) {
    console.error('Failed to create item:', error);
    showPopup('Failed to create item.', 'error');
  }
};
</script>