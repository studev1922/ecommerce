import { fileHelperAPIs } from '../models/utils/fileHelper.js';

export default (application, path) => {
    const folders = ['/images/user', '/images/category', '/images/product'];
    fileHelperAPIs(application, path, ...folders);
};
