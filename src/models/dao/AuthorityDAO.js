import AbstractDAO from './AbstractDAO.js';
import sql from '../services/sqlService.js';
import daoes from '../services/daoService.js';
import sp, { modify } from '../services/queryHelper.js';

/**
 * Only read and update data.
 * Cannot be insert or delete any in this table!!!
 */
export class RoleDAO extends AbstractDAO {

   constructor(storage) {
      const primary = 'rid';
      super('[ROLES]', primary, [primary, 'name'], storage);
   }

   save() { throw `this function in't working!` }
   delete() { throw `this function in't working!` }
}

export default class AuthorityDAO {

   table = "[AUTHORITIES]";
   uid = 'u_id';
   rid = 'r_id';

   async #read(top, fields, ...serials) {
      let { table } = this;
      let query = sp.select(table, top, fields, serials);
      return (await sql.execute(query)).recordset;
   }

   async #createRoles(u_id, names) {
      let data = (await daoes.role.getMap()), roles = []; // get all role in storage
      data.forEach((e, r_id) => { // get all roles includes names
         if (names.includes(e.name)) roles.push({ u_id, r_id })
      });
      return roles; // map roles to authorities data
   }

   getList = async () => this.#read();

   /**
    * @param {Array<String>} u_ids 
    * @returns all data with uid in u_ids 
    */
   async getByUID(u_ids) {
      if (!u_ids) return [];
      let condition = `WHERE ${this.uid} IN (${modify(u_ids)})`;
      return this.#read(undefined, undefined, condition);
   }

   async save(u_id, roles, getAuth = false) {
      if (!u_id || !roles) return [];
      let { table, uid, rid } = this;
      let auths = (await this.#createRoles(u_id, roles));
      let query = sp.multipleInsert(table, auths, [uid, rid]);
      return sql.execute(query)
         .then(() => getAuth ? auths : roles)
         .catch(e => { throw e });
   }
}