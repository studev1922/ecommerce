import express from 'express';
import userAPI from './api/userAPI.js';
import authAPI from './api/authAPI.js';
import productAPI from './api/productAPI.js';
import middleware from '../middleware/access.js';

const notFoundAPI = (firstPath, application) => {
    const notFound = (req, res) => {
        const paths = [
            '/roles', '/auths',
            '/users', '/categories',
            '/products', '/products-relationships', '/products-page/0?qty=6'
        ];
        const json = { message: `${req.originalUrl} not found!`, paths: [] };
        for (const path of paths) json.paths.push(`${firstPath}${path}`)
        json.files = [
            "/images/category/:fileName",
            "/api/images/category",
            "/api/images/product",
            "/api/images/user"
        ];

        return res.status(404).json(json);
    };
    application
        .use(firstPath, middleware, notFound)
        .use(`${firstPath}/*`, middleware, notFound);
};

export default (application, pathAPI = '') => {
    application.use(express.json());

    // APIs're ROUTER
    authAPI(pathAPI, application);
    userAPI(pathAPI, application);
    productAPI(pathAPI, application);
    notFoundAPI(pathAPI, application);
}