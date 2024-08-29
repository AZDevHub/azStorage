<!-- azStorage/src/components/UpdateItem.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Update Item</h1>
    <input v-model.trim="itemName" placeholder="Item Name" class="text-input" />
    <button @click="updateItem" class="button">Update</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const itemName = ref('');
const popup = ref(null);
const route = useRoute();

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const updateItem = async () => {
  const guid = route.params.guid;
  try {
    await apiClient.updateItem(guid, { name: itemName.value });
    showPopup('Item updated successfully!', 'success');
  } catch (error) {
    console.error('Failed to update item:', error);
    showPopup('Failed to update item.', 'error');
  }
};
</script>