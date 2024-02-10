<template>
  <div class="app-container centered-box">
    <h1 class="centered-box">{{ notFoundText }}</h1>
  </div>
</template>

<script setup lang="js">
import { onMounted, ref } from 'vue'
const notFoundText = ref(null)

onMounted(async () => {
  notFoundText.value = "These aren't the bits you're looking for"
})
</script>
