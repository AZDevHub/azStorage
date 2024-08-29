<!-- azStorage/src/components/RemoveFileAssociate.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Remove File Association</h1>
    <form @submit.prevent="removeFileAssociation">
      <div>
        <label for="itemGuid">Item GUID:</label>
        <input type="text" v-model="itemGuid" required class="text-input" />
      </div>
      <div>
        <label for="fileGuid">File GUID:</label>
        <input type="text" v-model="fileGuid" required class="text-input" />
      </div>
      <button type="submit" class="button">Remove Association</button>
    </form>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const itemGuid = ref('');
const fileGuid = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const removeFileAssociation = async () => {
  try {
    const response = await apiClient.deleteItemFile(itemGuid.value, fileGuid.value);
    if (response.status === 204) {
      showPopup('File association removed successfully!', 'success');
    } else {
      showPopup('Failed to remove file association.', 'error');
    }
  } catch (error) {
    console.error('Error removing file association:', error);
    showPopup('Error: Unable to remove file association.', 'error');
  }
};
</script>