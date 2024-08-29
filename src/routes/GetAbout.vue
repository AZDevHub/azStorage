<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">{{ welcomeText }}</h1>
    <h3 class="about">Powered by:</h3>
    <a href="https://vitejs.dev" target="_blank">
      <img src="../assets/vite.svg" class="logo vite-logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="../assets/vue.svg" class="logo vue-logo" alt="Vue logo" />
    </a>
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue'
const welcomeText = ref(null)

onMounted(async () => {
  welcomeText.value = 'Welcome to Arena APIs Portal'
})
</script>