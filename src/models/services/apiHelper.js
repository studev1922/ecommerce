import express, { Router } from 'express';

/**
 * 
 * @param {Object} _dao src/models/dao/...;
 * @param {String} func function name in dao
 * @param {Response} _res response to return json
 * @param  {...any} _params of func (function name in dao)
 * @returns 
 */
const daoEval = (_dao, func, _res, ..._params) => eval(`
    _dao.${func}(..._params)
        .then(result => _res.status(200).json(result))
        .catch(error => _res.status(500).json(error.originalError?.info))
        .finally(() => _res)
`);

/**
 * @param {Object<model>} dao 
 * @param {String} firstPath EX: http://localhost:3000/.../[users]/
 * @returns {Router} hard-delete data
 */
const option1 = (dao, firstPath) => {
    if (!dao) throw `dao is empty!`;
    else if (!firstPath) throw `firstPath is empty!`;
    const router = express.Router();

    router /* READ */
        // get all data
        .get(firstPath, (req, res) => {
            const data = req.body['ids'];
            const isAccess = req.body['access'];
            const isArr = Array.isArray(data) ? data.length : false;

            return isArr
                ? daoEval(dao, 'getByIds', res, data, isAccess) // get by multiple ids
                : daoEval(dao, 'getList', res, isAccess); // get all
        })
        // get by single id
        .get(`${firstPath}/:id`, (req, res) => daoEval(dao, 'getByIds', res, req.params['id']))

    router /* CREATE AND UPDATE */
        // insert data
        .post(firstPath, async (req, res) => daoEval(dao, 'insert', res, req.body))
        // update data
        .put(firstPath, (req, res) => daoEval(dao, 'update', res, req.body))

    router /* DELETE */
        // delete an object
        .delete(`${firstPath}/:id`, (req, res) => daoEval(dao, 'delete', res, req.params['id']))
        // delete multiple objects
        .delete(firstPath, (req, res) => daoEval(dao, 'delete', res, req.body));

    return router;
}

/**
 * @param {Object<model>} dao 
 * @param {String} firstPath EX: http://localhost:3000/.../[users]/
 * @returns {Router} has soft-delete and hard-delete
 */
const option2 = (dao, firstPath) => {
    if (!dao) throw `dao is empty!`;
    else if (!firstPath) throw `firstPath is empty!`;
    const router = express.Router();

    router /* READ */
        // get all data
        .get(firstPath, (req, res) => {
            const data = req.query['ids'];
            const isAccess = req.query['access'];
            const isArr = Array.isArray(data) ? data.length : false;

            return isArr
                ? daoEval(dao, 'getByIds', res, data, isAccess) // get by multiple ids
                : daoEval(dao, 'getList', res, isAccess); // get all
        })
        // get by single id
        .get(`${firstPath}/:id`, (req, res) => daoEval(dao, 'getByIds', res, req.params['id']))

    router /* CREATE AND UPDATE */
        // insert data
        .post(firstPath, async (req, res) => daoEval(dao, 'insert', res, req.body))
        // update data
        .put(firstPath, (req, res) => daoEval(dao, 'update', res, req.body))

    router /* DELETE */
        // single soft-delete
        .delete(`${firstPath}/:id`, (req, res) => daoEval(dao, 'setAccess', res, req.params['id'], false))
        // multiple soft-delete
        .delete(firstPath, (req, res) => daoEval(dao, 'setAccess', res, req.body, false))
        // single hard-delete
        .delete(`${firstPath}/hard/:id`, (req, res) => daoEval(dao, 'delete', res, req.params['id']))
        // multiple hard-delete
        .delete(`${firstPath}/hard`, (req, res) => daoEval(dao, 'delete', res, req.body))

    return router;
};

export default option1
export { option2, daoEval }