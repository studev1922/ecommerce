import sp, { modify, query2 as _sp } from '../utils/queryHelper.js';
import { sql } from '../utils/sqlService.js';
import authorityDAO, { role } from './AuthorityDAO.js'

export class UserDAO {

    static KEY = 'uid';
    static TABLE = '[USERS]';
    static FIELDS = [UserDAO.KEY, 'password', 'name', 'image'];
    static ROLES = 'roles'; // references

    #setUsers = async (users) => {
        const [roles] = [UserDAO.ROLES];

        if (!users) return [];
        for (const u of users) {
            u.password = u.password.toString('base64'); // format Buffer to base64
            u[roles] = (await authorityDAO.getByHalfId({ u_id: u.uid }));
        } return users; // get roles by uid(username, u_id) and return modified users
    }

    getList = async (isAccess) => { // prepare query > get user > set user > return user
        const [table, access] = [
            UserDAO.TABLE,
            isAccess != undefined ? `WHERE access=${isAccess ? 1 : 0}` : ''
        ];
        const query = sp.select(table, null, null, access);

        // execute query to get user > set user, get authorities > return data
        return sql.execute(query).then(async r => await this.#setUsers(r.recordset))
    };

    getByIds = async (ids, access) => {
        const [table, key] = [UserDAO.TABLE, UserDAO.KEY];
        const isArr = Array.isArray(ids); // prepare query
        let query = sp.select(table, null, null, 'WHERE (');

        if (isArr) { // add condition to read data by id
            for (let id of ids) query += `[${key}]='${id}' OR `;
            query = query.slice(0, query.length - 4) + ')' // splice last 'OR '
        } else query += `[${key}]='${ids}')`;

        if (typeof access != 'undefined') query += ` AND access=${modify(access)}`

        // execute and modify users to get authorities and format password
        return sql.execute(query).then(async r => isArr
            ? (await this.#setUsers(r.recordset))
            : (await this.#setUsers(r.recordset))[0]
        );
    };

    login = async (uid, password) => {
        if(!uid || !password) throw 'username or password incorect!'
        let query = sp.procedure('SP_LOGIN', [uid, password]);
        return sql.execute(query).then(async r => {
            let [user] = r.recordset;
            delete user.access;
            delete user.regTime;
            delete user.password;
            user.roleIds = (await authorityDAO.getByHalfId({ u_id: user.uid })).map(e => e.r_id);
            return user;
        });
    }

    register = async (uid, password, name, image, roles) => {
        let query = sp.procedure('SP_REGISTER', [uid, password, name, image]);

        return sql.execute(query).then(async r => {
            if (roles?.length) await authorityDAO.insert(roles, true);
            return (await this.#setUsers(r.recordset))[0]
        });
    }

    insert = async (data) => { // insert data > get all data updated > return new data
        const [table, key, fields, roles] = [
            UserDAO.TABLE, UserDAO.KEY,
            UserDAO.FIELDS, UserDAO.ROLES
        ];
        const isArr = Array.isArray(data); // prepare query
        const query = sp.insert(table, data, fields, key);

        return sql.execute(query).then(async _r => { // insert query
            if (isArr) // insert authorities when roles exists
                data.forEach(e => { if (e[roles]) authorityDAO.insert(e[roles]) });
            else if (data[roles]) authorityDAO.insert(data[roles]);

            return isArr // is array to read all by ids <> read by id
                ? this.getById(data.map(e => e[key]))
                : this.getById(data[key])
        });
    };

    update = async (data) => { // update data > get all data inserted > return new data
        const [table, key, fields] = [UserDAO.TABLE, UserDAO.KEY, UserDAO.FIELDS];
        const query = sp.update(table, data, fields, key);
        return sql.execute(query).then(async _r => this.getById( // get new data
            Array.isArray(data) ? data.map(e => e[key]) : data[key]
        ));
    };

    setAccess = async (ids, access) => {
        const [table, key] = [UserDAO.TABLE, UserDAO.KEY];
        let query = _sp.toggleAccess(table, key, ids, access);
        return sql.execute(query).then(async r => r.rowsAffected[0]);
    };

    delete = async (ids) => { // delete by id or multiple ids > return Total of the rowsAffected
        const [table, key] = [UserDAO.TABLE, UserDAO.KEY];
        const query = sp.delete(table, key, ids);
        return sql.execute(query).then(async r => r.rowsAffected.reduce((a, b) => a + b));
    };

}

export default new UserDAO();