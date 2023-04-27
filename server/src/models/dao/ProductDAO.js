import AbstractDAO from './AbstractDAO.js';
import sp from '../services/queryHelper.js';
import sql from '../services/sqlService.js';

class ProductImage {
   static table = '[PRODUCT_IMAGES]';
   static fields = ['pr_id', 'image'];

   static async #executeStack(values) {
      let { table, fields } = this;
      let [sizeQuery, result] = [1e3, new Array()];
      let countExecute = Math.floor(values.length / sizeQuery) + 1;
      let execute = async (data, i) => {
         let query = sp.multipleInsert(table, data, fields)
         await sql.execute(query).then(_ => {
            result.push({ message: 'success', range: [i, data.length] });
         }).catch(e => {
            result.push({ message: e.message, range: [i, data.length] });
         })
      }

      if (values.length > sizeQuery)
         for (let i = 0; i < countExecute; i++)
            await execute(
               values.splice(0, sizeQuery),
               i * sizeQuery
            )
      else await execute(values, 0);

      return result;
   }

   static async save(data, constants) {
      if (!data) throw `input data cannot be empty!`;

      let { primary, images } = constants;
      let [isArray, values] = [Array.isArray(data), new Array()];
      function set(e) {
         let pr_id = e[primary];
         e[images]?.forEach(image => values.push({ pr_id, image }));
      }

      if (isArray) for (let e of data) set(e); else set(data);
      return this.#executeStack(values);
   }
}

export default class ProductDAO extends AbstractDAO {

   constructor(storage) {
      const primary = 'prid';
      const fields = [
         'subject', 'note', 'price', 'quantity',
         'u_id', 'c_id'
      ];
      super('[PRODUCTS]', primary, fields, storage);
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
      if (data instanceof Map) data.forEach(e => setOnce(e)); else setOnce(data);
      return data;
   }

   async pullList() {
      let { data, table, primary } = this;
      let query = sp.select(table);
      let result = (await sql.execute(query)).recordset;

      data.clear();
      result.forEach(e => data.set(e[primary], e));
      this.#setData(data);
   }

   save = (values) => super.save(values, true)
      .then(async result => {
         let { images } = this;
         result.forEach((e, i) => e[images] = values[i][images]);
         await ProductImage.save(result, this);
         return result;
      });
}