<template>
  <div>
    <img :src="iconSrc" alt="Icon" />
  </div>
</template>

<script setup lang="js">
import iconSrc from '@/assets/icons/IconIdea.png'; 
</script>

<script>
export default {
  name: 'IconIdea'
}
</script>