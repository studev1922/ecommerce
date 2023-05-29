import AbstractDAO from './AbstractDAO.js';
import sp, { modify } from '../services/queryHelper.js';
import sql from '../services/sqlService.js';

export default class UserDAO extends AbstractDAO {

   constructor(data) {
      super('[USERS]', 'uid', ['uid', 'password', 'name', 'image'], data);
      this.role = 'roles';
   }

   #setData(data, ...deletes) {
      let { role } = this;
      let setOnce = (e) => {
         e.password = e.password?.toString('base64');
         if (e[role]) e[role] = JSON.parse(e[role]).map(r => r.name);
         for (let del of deletes) delete e[del];
      }

      if (data instanceof Map || Array.isArray(data))
         data.forEach((e) => setOnce(e)); else setOnce(data);
      return data;
   }

   async pullList() {
      let { data, primary } = this;
      let query = sp.select('[VIEW_USERS]');
      let result = (await sql.execute(query)).recordset;
      data.clear();
      result.forEach(e => data.set(e[primary], e));
      this.#setData(data);
   }

   /**
    * @param {String} uid uid is username
    * @param {String} password for login
    * @returns {Object} user with uid and password
    */
   async login(e) {
      if (!e?.uid || !e?.password) throw 'username or password incorect!'
      let query = sp.procedure('SP_LOGIN', e);

      return sql.execute(query).then(async r => {
         let [user] = r.recordset;
         this.#setData(user, 'password');
         return user;
      });
   }

   /**
    * 
    * @param {String} uid 
    * @param {String} password 
    * @param {String} name 
    * @param {String} image 
    * @param {Array<String>} roles 
    * @returns 
    */
   async register(uid, password, name, image, roles) {
      // SP_REGISTER IS PROCEDURE INSERT AND SELECT NEW ACCOUNT
      return this.save({ uid, password, name, image, roles });
   }

   /**
    * multiple registers
    * @param {Array<User>} values an array of register 
    * @returns {Promise} all data of user
    */
   async save(values) {
      let { primary, role } = this;
      let proceName = 'SP_REGISTER';
      let isArray = Array.isArray(values);
      let ids = values.map(e => { e[role] = e[role].toString(); return e[primary]});
      let query = sp.procedure(proceName, values);

      return this.#restTransaction(query, ids, isArray);
   }

   /**
    * @param {Array<Object>} values multiple data of user
    * @returns {Promise} all data updated
    */
   async update(values) {
      let query = new String();
      let { table, fields, primary } = this;
      let isArray = Array.isArray(values);
      let ids = values.map(e => e[primary]);

      if (!isArray) values = [values];
      values.forEach(e => e.password = { type: "PWDENCRYPT('?')", value: e.password });
      query = sp.update(table, values, fields, primary);

      return this.#restTransaction(query, ids, isArray);
   }

   async #restTransaction(query, ids, isArray) {
      let { data, primary } = this;
      query += sp.select('VIEW_USERS', undefined, undefined, `WHERE ${primary} IN (${modify(ids)})`);

      return sql.execute(sp.transaction(query, true))
         .then(r => {
            let result = this.#setData(r.recordset);
            data.sets(primary, result);
            return isArray ? result : result[0];
         })
   }
}