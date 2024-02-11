<template>
  <nav class="column is-2 menu">
    <router-link class="menu-label" :to="navHeader.to" rel="noopener">{{
      navHeader.text
    }}</router-link>
    <ul class="menu-list">
      <li v-for="item in items" :key="item.text">
        <WelcomeItem>
          <template #icon>
            <component :is="item.icon" />
          </template>
          <template #heading>
            <router-link :to="item.to" rel="noopener">{{ item.text }}</router-link>
          </template>
        </WelcomeItem>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="js">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
import SupportIcon from './icons/IconSupport.vue'

const items = [
  { icon: DocumentationIcon, to: '/upload', text: 'Upload Files' },
  { icon: ToolingIcon, to: '/list', text: 'List Directory' },
  { icon: EcosystemIcon, to: '/status', text: 'API Status' },
  { icon: CommunityIcon, to: '/sas', text: 'Get SAS URL' },
  { icon: SupportIcon, to: '/about', text: 'About' }
]

const navHeader = { to: '/home', text: 'Navigation' }
</script>
