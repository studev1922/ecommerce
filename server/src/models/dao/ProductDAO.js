import AbstractDAO from './AbstractDAO.js';
import sp from '../services/queryHelper.js';
import sql from '../services/sqlService.js';

export default class ProductDAO extends AbstractDAO {

   constructor(arrayStorage = []) {
      const primary = 'prid';
      const fields = [
         'subject', 'note', 'price',
         'quantity', 'regTime', 'access',
         'u_id', 'c_id'
      ];
      if (!Array.isArray(arrayStorage)) arrayStorage = [];
      super('[PRODUCTS]', primary, fields, arrayStorage);
      this.user = 'user'
      this.images = 'images'
      this.category = 'category'
   }

   #setData(data, ...deletes) {
      let { images, category, user } = this;
      let setOnce = async (e) => {
         if (e[images]) e[images] = JSON.parse(e[images]).map(e => e.image);
         if (e[category]) {
            e[category] = JSON.parse(e[category]);
            delete e[category]['cgid']
         }
         if (e[user]) {
            let { image, name } = JSON.parse(e[user]);
            e[user] = { name, image };
         }

         for (let del of deletes) delete e[del];
      }
      if (Array.isArray(data)) for (let e of data) setOnce(e)
      else setOnce(data);
      return data;
   }

   async pullList() {
      let query = sp.select('VIEW_PRODUCTS');
      let result = (await sql.execute(query)).recordset;
      while (this.data.length) this.data.pop();
      this.data.push(...result);
      this.#setData(this.data);
   }

}