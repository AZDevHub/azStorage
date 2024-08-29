import { createRouter, createMemoryHistory } from 'vue-router';
import NotFound from '../routes/NotFound.vue';
import Login from '../routes/ApiLogin.vue';
import Logout from '../routes/ApiLogout.vue';
import GetAbout from '../routes/GetAbout.vue'
import GetItemNumberFormats from '../routes/GetItemNumberFormats.vue';
import GetItemCategories from '../routes/GetItemCategories.vue';
import GetFileCategories from '../routes/GetFileCategories.vue';
import GetItemAttributes from '../routes/GetItemAttributes.vue';
import GetItemNumberFormat from '../routes/GetItemNumberFormat.vue';
import GetItemRevisions from '../routes/GetItemRevisions.vue';
import GetItemRequirements from '../routes/GetItemRequirements.vue';
import GetItemRelationships from '../routes/GetItemRelationships.vue';
import GetCategoryAttributes from '../routes/GetCategoryAttributes.vue';
import GetItems from '../routes/GetItems.vue';
import GetItem from '../routes/GetItem.vue';
import UpdateItem from '../routes/UpdateItem.vue';
import CreateItem from '../routes/CreateItem.vue';
import DeleteItem from '../routes/DeleteItem.vue';
import GetItemBOM from '../routes/GetItemBOM.vue';
import GetItemFiles from '../routes/GetItemFiles.vue';
import GetItemFileContent from '../routes/GetItemFileContent.vue';
import AddItemFile from '../routes/AddItemFile.vue';
import AddItemFileContent from '../routes/AddItemFileContent.vue';
import DeleteItemFile from '../routes/DeleteItemFile.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/about', name: 'GetAbout', component: GetAbout },
  { path: '/login', name: 'Login', component: Login },
  { path: '/logout', name: 'Logout', component: Logout },
  { path: '/item/numberformats', name: 'GetItemNumberFormats', component: GetItemNumberFormats },
  { path: '/item/categories', name: 'GetItemCategories', component: GetItemCategories },
  { path: '/file/categories', name: 'GetFileCategories', component: GetFileCategories },
  { path: '/item/attributes', name: 'GetItemAttributes', component: GetItemAttributes },
  { path: '/item/numberformats/:guid', name: 'GetItemNumberFormat', component: GetItemNumberFormat },
  { path: '/items/:guid/revisions', name: 'GetItemRevisions', component: GetItemRevisions },
  { path: '/items/:guid/requirements', name: 'GetItemRequirements', component: GetItemRequirements },
  { path: '/items/:guid/relationships', name: 'GetItemRelationships', component: GetItemRelationships },
  { path: '/item/categories/:guid/attributes', name: 'GetCategoryAttributes', component: GetCategoryAttributes },
  { path: '/items', name: 'GetItems', component: GetItems },
  { path: '/items/:guid', name: 'GetItem', component: GetItem },
  { path: '/items/:guid', name: 'UpdateItem', component: UpdateItem },
  { path: '/items', name: 'CreateItem', component: CreateItem },
  { path: '/items/:guid', name: 'DeleteItem', component: DeleteItem },
  { path: '/items/:guid/bom', name: 'GetItemBOM', component: GetItemBOM },
  { path: '/items/:guid/files', name: 'GetItemFiles', component: GetItemFiles },
  { path: '/items/:guid/files/:fileguid/content', name: 'GetItemFileContent', component: GetItemFileContent },
  { path: '/items/:guid/files', name: 'AddItemFile', component: AddItemFile },
  { path: '/items/:guid/files/:fileguid/content', name: 'AddItemFileContent', component: AddItemFileContent },
  { path: '/items/:guid/files/:fileguid', name: 'DeleteItemFile', component: DeleteItemFile },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
];

const router = createRouter({
  history: createMemoryHistory(),
  routes
});

export default router;