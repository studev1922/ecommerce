import { fileHelperAPIs } from '../models/services/fileHelper.js';

export default (application, path) => {
    const folders = ['/images/user', '/images/category', '/images/product'];
    fileHelperAPIs(application, path, ...folders);
};
