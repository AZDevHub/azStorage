<!-- azStorage/src/components/Logout.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Logout</h1>
    <button @click="logout">Logout</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';

const popup = ref(null);
const router = useRouter(); 

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const logout = async () => {
  try {
    await apiClient.logout();
    showPopup('Logout successful!', 'success');
      router.push('/about'); // Redirect to the home page or desired route
  } catch (error) {
    console.error('Logout failed:', error);
    showPopup('Logout failed. Please try again.', 'error');
  }
};
</script>