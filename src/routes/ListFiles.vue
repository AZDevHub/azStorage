<template>
  <div class="app-container centered-box">
    <h1 class="about centered-box">Uploaded Files</h1>
    <DataTable
      :data="fileList"
      :columns="columns"
      class="table table-hover table-striped"
      width="100%"
    >
      <thead>
        <tr>
          <th>Link</th>
          <th>File Name</th>
          <th>Size</th>
          <th>Created On</th>
          <th>Last Modified</th>
          <th>ETag</th>
        </tr>
      </thead>
    </DataTable>
    <ShowPopup ref="popup" />
  </div>
</template>
<script setup lang="js">
import { onMounted, ref } from 'vue'

import DataTable from 'datatables.net-vue3'
import DataTablesCore from 'datatables.net-bs5'
import apiClient from '../services/ApiServices'
import ShowPopup from '../components/show-popup.vue'

DataTable.use(DataTablesCore)

const uploadContainer = 'upload'
const fileList = ref([])
const columns = [{ data: 'DLlink' }, { data: 'fileName' },{ data: 'size'}, { data: 'createdOn' }, { data: 'lastModified' }, { data: 'etag' }]

const popup = ref(null)
const showPopup = (message, type) => {
  popup.value.show(message, type)
}

// Fetching file list on component mount
onMounted(async () => {
  try {
    const response = await apiClient.getList(uploadContainer)
    fileList.value = response.data.list.map((fileMeta) => {
    return {
      DLlink: fileMeta.DLLink,
      fileName: fileMeta.fileName,
      size: fileMeta.size,
      createdOn: fileMeta.createdOn,
      lastModified: fileMeta.lastModified,
      etag: fileMeta.etag
      }
    })
  } catch (error) {
    console.error('There was an error fetching the data:', error)
    showPopup('Failed to fetch file list. Please check API status.', 'error')
  }
})
</script>

<style>
@import "bootstrap";
@import "datatables.net-bs5";
</style>
