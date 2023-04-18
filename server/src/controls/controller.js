import { fileHelperAPIs } from '../models/utils/fileHelper.js';
import api_application from './router/api.js';

export default (application, path) => {
    const folders = ['/images/user', '/images/category', '/images/product'];
    fileHelperAPIs(application, path, ...folders);
    api_application(application, path); // USE API FOR CLIENT : /api
};
