import axios from 'axios'

const API_SERVER =
    import.meta.env.VITE_API_SERVER;
const STORAGE_ACCOUNT_NAME =
    import.meta.env.VITE_STORAGE_ACCOUNT_NAME;

console.log(STORAGE_ACCOUNT_NAME)
console.log(API_SERVER)

class ApiClient {
    constructor() {
        this.apiClient = axios.create({
            baseURL: `${API_SERVER}/api` ||
                `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net/api`,
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