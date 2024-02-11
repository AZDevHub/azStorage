<template>
  <div id="app">
    <HeaderBar />
    <div class="section columns">
      <NavBar />
      <main class="column">
        <div class="padded-box">
          <router-view />
        </div>
      </main>
    </div>
    <Popup />
    <FooterBar />
  </div>
</template>

<script setup lang="js">
import HeaderBar from './components/header-bar.vue'
import NavBar from './components/nav-bar.vue'
import Popup from './components/show-popup.vue'
import FooterBar from './components/footer-bar.vue'
</script>

<style lang="scss">
@import "./assets/styles.css";
</style>
