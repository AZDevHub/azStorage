import axios from 'axios'

class ApiClient {
  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://blob.storage.windows.net/api',
      withCredentials: false,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }
  getList(containerName) {
    return this.apiClient.get('/list', { params: { container: containerName } })
  }

  getSASUrl(containerName, fileName, permissions) {
    return this.apiClient.get('/sas', {
      params: { container: containerName, file: fileName, permission: permissions }
    })
  }

  getStatus() {
    return this.apiClient.get('/status')
  }

  fileUpload(containerName, file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.apiClient.post('/upload', formData, { params: { container: containerName } })
  }
}

export default new ApiClient()