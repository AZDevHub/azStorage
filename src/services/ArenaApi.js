// azStorage/src/services/ArenaApi.js
import axios from 'axios';

const log = import.meta.env.VUE_APP_ARENA_API_LOG;
const baseURL = import.meta.env.VUE_APP_ARENA_API_URL;
const email = import.meta.env.VUE_APP_ARENA_API_EMAIL;
const password = import.meta.env.VUE_APP_ARENA_API_PASSWORD;
const workspaceId = import.meta.env.VUE_APP_ARENA_API_WORKSPACEID;
let sessionId = null;
class ApiClient {
    constructor(baseURL) {
        this.apiClient = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async about() {
        return this.apiClient.get('/about'); 
    }

    async login(data) {
        if (!data) {
            data = {
                email: email,
                password: password,
                workspaceId: workspaceId
            };
        }
        const response = await this.apiClient.post('/login', data);
        sessionId = response.data.sessionId;
        if (sessionId) {    
            this.apiClient.defaults.headers.common['arena_session_id'] = sessionId;
            if (log) {
                console.log('Session ID:', sessionId);
            }
        }
        return response.data;
    }

    async logout() {
        return this.apiClient.get('/logout');
    }

    async getItemNumberFormats() {
        return this.apiClient.get('/item/numberformats');
    }

    async getItemCategories() {
        return this.apiClient.get('/item/categories');
    }

    async getFileCategories() {
        return this.apiClient.get('/file/categories');
    }

    async getItemAttributes() {
        return this.apiClient.get('/item/attributes');
    }

    async getItemNumberFormat(guid) {
        return this.apiClient.get(`/item/numberformats/${guid}`);
    }

    async getItemRevisions(guid) {
        return this.apiClient.get(`/items/${guid}/revisions`);
    }

    async getItemRequirements(guid) {
        return this.apiClient.get(`/items/${guid}/requirements`);
    }

    async getItemRelationships(guid) {
        return this.apiClient.get(`/items/${guid}/relationships`);
    }

    async getCategoryAttributes(guid) {
        return this.apiClient.get(`/item/categories/${guid}/attributes`);
    }

    async getItems(params) {
        return this.apiClient.get('/items', { params });
    }

    async getItem(guid) {
        return this.apiClient.get(`/items/${guid}`);
    }

    async updateItem(guid, data) {
        return this.apiClient.put(`/items/${guid}`, data);
    }

    async createItem(data) {
        return this.apiClient.post('/items', data);
    }

    async deleteItem(guid) {
        return this.apiClient.delete(`/items/${guid}`);
    }

    async getItemBOM(guid) {
        return this.apiClient.get(`/items/${guid}/bom`);
    }

    async getItemFiles(guid) {
        return this.apiClient.get(`/items/${guid}/files`);
    }

    async getItemFileContent(guid, fileGuid) {
        return this.apiClient.get(`/items/${guid}/files/${fileGuid}/content`);
    }

    async addItemFile(guid, fileData) {
        return this.apiClient.post(`/items/${guid}/files`, fileData);
    }

    async addItemFileContent(guid, fileGuid, content) {
        return this.apiClient.post(`/items/${guid}/files/${fileGuid}/content`, content);
    }

    async deleteItemFile(guid, fileGuid) {
        return this.apiClient.delete(`/items/${guid}/files/${fileGuid}`);
    }

    async getNotFound() {
        this.setBaseURL('/:pathMatch(.*)*'); // Set the base URL based on the path
        return this.apiClient.get('/notfound');
    }
}
const apiClient = new ApiClient(baseURL);
export default apiClient; // Exporting the apiClient for use in other modules