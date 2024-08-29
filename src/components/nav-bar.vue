<template>
  <nav class="column is-2 menu">
    <router-link class="menu-label" :to="navHeader.to" rel="noopener">{{ navHeader.text }}</router-link>
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

// Import all icons
import IconAdd from './icons/IconAdd.vue'
import IconChart from './icons/IconChart.vue'
import IconBriefcase from './icons/IconBriefcase.vue'
import IconCommunity from './icons/IconCommunity.vue'
import IconEcosystem from './icons/IconEcosystem.vue'
import IconDocumentation from './icons/IconDocumentation.vue'
import IconSettings from './icons/IconSettings.vue'
import IconTooling from './icons/IconTooling.vue'
import IconUser from './icons/IconUser.vue'
import IconUserAdd from './icons/IconUserAdd.vue'
import IconShare from './icons/IconShare.vue'
import IconCalendar from './icons/IconCalendar.vue'
import IconDownload from './icons/IconDownload.vue'
import IconFolder from './icons/IconFolder.vue'
import IconRefresh from './icons/IconRefresh.vue'
import IconSpeech from './icons/IconSpeech.vue'
import IconFire from './icons/IconFire.vue'
import IconKey from './icons/IconKey.vue'
import IconIdea from './icons/IconIdea.vue'
import IconSearch from './icons/IconSearch.vue'
import IconSupport from './icons/IconSupport.vue'

// Define the items with their respective icons and random routes
const items = [
  { icon: IconAdd, to: '/item/categories', text: 'Add Item' },
  { icon: IconChart, to: '/item/numberformats', text: 'View Charts' },
  { icon: IconBriefcase, to: '/items', text: 'Briefcase' },
  { icon: IconCommunity, to: '/item/attributes', text: 'Community' },
  { icon: IconEcosystem, to: '/items/:guid/revisions', text: 'Ecosystem' },
  { icon: IconDocumentation, to: '/about', text: 'Documentation' },
  { icon: IconSettings, to: '/login', text: 'Settings' },
  { icon: IconTooling, to: '/logout', text: 'Tooling' },
  { icon: IconUser, to: '/items/:guid', text: 'User Profile' },
  { icon: IconUserAdd, to: '/items/:guid/files', text: 'Add User' },
  { icon: IconShare, to: '/items/:guid/files/:fileguid/content', text: 'Share' },
  { icon: IconCalendar, to: '/items/:guid/files/:fileguid', text: 'Calendar' },
  { icon: IconDownload, to: '/items/:guid/requirements', text: 'Requirements' },
  { icon: IconFolder, to: '/items/:guid/relationships', text: 'Relationships' },
  { icon: IconRefresh, to: '/items/:guid/bom', text: 'BOM' },
  { icon: IconSpeech, to: '/file/categories', text: 'File Categories' },
  { icon: IconFire, to: '/item/numberformats/:guid', text: 'Number Format' },
  { icon: IconKey, to: '/items/:guid/files', text: 'Item Files' },
  { icon: IconIdea, to: '/item/categories/:guid/attributes', text: 'Category Attributes' },
  { icon: IconSearch, to: '/items/:guid', text: 'Get Item' },
  { icon: IconSupport, to: '/items', text: 'Get Items' },
]

const navHeader = { to: '/home', text: 'Navigation' }
</script>