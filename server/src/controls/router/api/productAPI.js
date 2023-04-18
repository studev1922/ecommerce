import middleware from '../../middleware/access.js';
import dao, { categoryDAO } from '../../../models/dao/ProductDAO.js';
import option1, { option2, daoEval } from '../../../models/utils/apiHelper.js';

const helper = {
    getPage: (req, res) => {
        const pagePath = req.params.page;
        const { page, qty } = req.query;
        return daoEval(dao, 'getPage', res, qty || 6, pagePath || page || 0, true);
    },
    getRelationships: (req, res) => {
        const { ids, access, top, fields } = req.query;
        const byIds = Array.isArray(ids) ? ids.length : ids != undefined;

        return byIds
            ? daoEval(dao, 'getRelationshipByIds', res, ids, access, top, fields) // get by multiple ids
            : daoEval(dao, 'getRelationships', res, access, top, fields)
    },
    getRelationships_ById: (req, res) => {
        let { id } = req.params;
        return daoEval(dao, 'getRelationshipByIds', res, id, undefined, undefined);
    }
}

export default (paths, application) => {
    paths = Array.isArray(paths) ? paths.join('') : paths;

    // CATEGORIES
    const cgLastPath = '/categories';
    const cgRouter = option1(categoryDAO, cgLastPath);

    // PRODUCTS
    const prLastPath = '/products';
    const prRouter = option2(dao, prLastPath)
        .get(`${prLastPath}-page`, helper.getPage)
        .get(`${prLastPath}-page/:page`, helper.getPage)
        .get(`${prLastPath}-relationships`, helper.getRelationships)
        .get(`${prLastPath}-relationships/:id`, helper.getRelationships_ById);

    application.use(paths, middleware, cgRouter);
    application.use(paths, middleware, prRouter);
}