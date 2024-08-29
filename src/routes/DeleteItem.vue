<!-- azStorage/src/components/DeleteItem.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Delete Item</h1>
    <input v-model.trim="itemId" placeholder="Item ID" class="text-input" />
    <button @click="deleteItem" class="button">Delete</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const itemId = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const deleteItem = async () => {
  try {
    await apiClient.deleteItem(itemId.value);
    showPopup('Item deleted successfully!', 'success');
  } catch (error) {
    console.error('Failed to delete item:', error);
    showPopup('Failed to delete item.', 'error');
  }
};
</script>