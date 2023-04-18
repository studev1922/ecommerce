import sp, { modify } from '../utils/queryHelper.js';
import request, { sql } from '../utils/sqlService.js';

const _sp = {

    delete: (ids) => { // create query to delete multiple id
        const [id1, id2] = AuthorityDAO.FIELDS;
        let query = `DELETE FROM ${AuthorityDAO.TABLE} WHERE `;

        if (Array.isArray(ids)) {
            for (const id of modify(ids))
                query += `(${id1}=${id[id1]} AND ${id2}=${id[id2]})\nOR`;
            query = query.slice(0, query.length - 3);
        } else {
            const id = modify(ids);
            query += `(${id1}=${id[id1]} AND ${id2}=${id[id2]})`;
        } return query;
    }
}

const role = {
    KEY: 'rid',
    TABLE: '[ROLES]',

    getList: async () => {
        let query = sp.select(role.TABLE);
        return (await request(query)).recordset
    },

    getByIds: async (ids) => {
        const isArr = Array.isArray(ids);
        let query = sp.select(role.TABLE, null, null, `WHERE ${role.KEY} = `);

        // multiple id or single id
        query += isArr ? ids.toString().replaceAll('\x2c', ` OR ${role.KEY}=`) : ids;
        const data = (await request(query)).recordset;
        return isArr ? data : data[0];
    }
}

export class AuthorityDAO {
    static TABLE = '[AUTHORITIES]';
    static FIELDS = ['u_id', 'r_id'];

    getList = async () => { // get all authorities
        const query = sp.select(AuthorityDAO.TABLE);
        return sql.execute(query).then(async r => r.recordset)
    };

    /**
     * EX1: {u_id: 'abc'} to get all authorities by u_id = 'abc'
     * EX2: {r_id: 1} to get all authorities by r_id = 1
     * 
     * @param {Object} id to get data
     * @returns all the data got by half id
     */
    getByHalfId = async (id) => { // get by u_id or r_id
        const [table, fields, top] = [AuthorityDAO.TABLE, AuthorityDAO.FIELDS, undefined];
        const key = Object.keys(id)[0];
        const query = sp.select(table, top, fields, `WHERE ${key} = ${modify(id[key])}`);
        return sql.execute(query).then(async r => r.recordset)
    }

    getByIds = async (ids) => { // get by id EX: {u_id: 'abc', r_id: 1} WHERE u_id='abc' AND r_id=1
        let query = sp.select(AuthorityDAO.TABLE, null, null, 'WHERE ');
        const isArr = Array.isArray(ids);

        if (isArr) { // single id or multiple id
            for (const id of ids) {
                const { u_id, r_id } = modify(id);
                query += `(u_id=${u_id} AND r_id=${r_id}) OR `;
            } query = query.slice(0, query.length - 3);
        } else {
            const { u_id, r_id } = modify(ids);
            query += `(u_id=${u_id} AND r_id=${r_id})`;
        }
        return sql.execute(query).then(async r => r.recordset)
    };

    insert = async (data, insertOnly) => {
        const query = sp.multipleInsert(AuthorityDAO.TABLE, data, AuthorityDAO.FIELDS);
        return sql.execute(query).then(async r => insertOnly ? r : await this.getByIds(data));
    };

    delete = async (ids) => {
        let query = _sp.delete(ids);
        return sql.execute(query).then(async r => r.rowsAffected[0]);
    };

}

export { role }
export default new AuthorityDAO();