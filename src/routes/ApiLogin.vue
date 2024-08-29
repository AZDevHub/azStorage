<!-- azStorage/src/components/Login.vue -->
<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Login</h1>
    <input v-model.trim="username" placeholder="Username" />
    <input v-model.trim="password" type="password" placeholder="Password" />
    <button @click="login">Login</button>
    <ShowPopup ref="popup" />
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '../services/ArenaApi.js';
import ShowPopup from '../components/show-popup.vue';


const username = ref('');
const password = ref('');
const workspaceId = ref('');
const popup = ref(null);

const showPopup = (message, type) => {
  popup.value.show(message, type);
};

const router = useRouter(); 

const login = async () => {
  if (!username.value || !password.value || !workspaceId.value) {
    showPopup('Please enter username, password and workspaceId', 'error');
    return;
  }
 try {
    const response = await apiClient.login({ username: username.value, password: password.value, workspaceId: workspaceId.value });
    if (response.status === 200) {
      showPopup('Login successful!', 'success');
      router.push('/about'); // Redirect to the home page or desired route
    } else {
      showPopup('Login failed. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Login failed:', error);
    showPopup('Login failed. Please try again.', 'error');
  }
};
</script>