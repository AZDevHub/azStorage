<template>
  <div v-if="message" :class="`status status-${type}`">{{ message }}</div>
</template>

<script setup lang="js">
import { ref } from 'vue'

const message = ref('')
const type = ref('')

const show = (msg, msgType) => {
  clear()
  message.value = msg
  type.value = msgType
  setTimeout(() => {
    clear()
  }, 3000)
}

const clear = () => {
  message.value = ''
  type.value = ''
}
defineExpose({ show })
</script>
