import middleware from '../../middleware/access.js'
import dao, { role } from '../../../models/dao/AuthorityDAO.js';
import option1, { daoEval } from '../../../models/utils/apiHelper.js'

export default (paths, application) => {
    const authRouter = option1(dao, '/auths');
    const roleRouter = option1(role, '/roles');
    roleRouter.get('/auths/:key/:id', (req, res) => {
        const { key, id } = req.params;
        switch (key) {
            case 'r_id': case 'rid':
                return daoEval(dao, 'getByHalfId', res, { r_id: id });
            case 'u_id': case 'uid':
                return daoEval(dao, 'getByHalfId', res, { u_id: id });
            default: res.status(404).json({ message: `“${req.baseUrl}/${key}” not found!` });
        }
    });

    application.use(Array.isArray(paths) ? paths.join('') : paths, middleware, authRouter);
    application.use(Array.isArray(paths) ? paths.join('') : paths, middleware, roleRouter);
}