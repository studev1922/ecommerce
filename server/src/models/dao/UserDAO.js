import AbstractDAO from './AbstractDAO.js';
import sp from '../services/queryHelper.js';
import sql from '../services/sqlService.js';
import daoes from '../services/daoService.js';

export default class UserDAO extends AbstractDAO {

   constructor(storageArray = []) {
      if (!Array.isArray(storageArray)) storageArray = [];
      super('[USERS]', 'uid', ['uid', 'password', 'name', 'image'], storageArray);
      this.role = 'roles';
   }

   #setData(data, ...deletes) {
      let { primary, role } = this;
      let setOnce = (e) => {
         e.password = e.password.toString('base64');
         if (e[role]) e[role] = JSON.parse(e[role]).map(r => r.name);
         for (let del of deletes) delete e[del];
      }

      if (Array.isArray(data)) for (let e of data) setOnce(e)
      else setOnce(data);
      return data;
   }

   async pullList() {
      let query = sp.select('[VIEW_USERS]');
      let result = (await sql.execute(query)).recordset;
      while (this.data.length) this.data.pop();
      this.data.push(...result);
      this.#setData(this.data);
   }

   async login(uid, password) {
      if (!uid || !password) throw 'username or password incorect!'
      let query = sp.procedure('SP_LOGIN', [uid, password]);

      return sql.execute(query).then(async r => {
         let [user] = r.recordset;
         this.#setData(user, 'access', 'regTime', 'password');
         return user;
      });
   }

   async register(uid, password, name, image, roles) {
      // SP_REGISTER IS PROCEDURE INSERT AND SELECT NEW ACCOUNT
      let query = sp.procedure('SP_REGISTER', [uid, password, name, image]);

      return sql.execute(query).then(async r => {
         let result = (await this.#setData(r.recordset))[0];
         result[this.role] = (await daoes.auth.save(uid, roles));
         storageArray.push(result);
         return result;
      });
   }
}