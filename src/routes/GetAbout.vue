<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">About This App</h1>
    <div v-if="aboutText">{{ aboutText }}</div>
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue'
const aboutText = ref(null)

onMounted(async () => {
  aboutText.value = 'TBD TBD TBD'
})
</script>
