import axios from 'axios'


class ApiClient {
    constructor() {
        const baseURL = window.location.origin.includes('localhost') ? `${import.meta.env.VITE_ENDPOINT}/api` : `${window.location.origin}/api`;
        this.apiClient = axios.create({
            baseURL: baseURL,
            withCredentials: false,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
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

        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
            params: { container: containerName, file: file.name },
        };
        return this.apiClient.post('/upload', formData, config)
    }
}

export default new ApiClient()