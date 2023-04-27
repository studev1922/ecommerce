import AbstractDAO from './AbstractDAO.js';
import sql from '../services/sqlService.js';
import sp, { modify } from '../services/queryHelper.js';

class ProductImage {
   static table = '[PRODUCT_IMAGES]';
   static t_prid = 'pr_id';
   static t_image = 'image';

   static async #executeStack(values) {
      let { table, t_prid, t_image } = this;
      let [sizeQuery, result] = [1e3, new Array()];
      let countExecute = Math.floor(values.length / sizeQuery) + 1;
      let execute = async (data, i) => {
         let query = sp.multipleInsert(table, data, [t_prid, t_image])
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

   static async update(data, constants) {
      let isArray = Array.isArray(data);
      let { primary } = constants;
      let ids = isArray ? data.map(e => e[primary]) : data[primary];

      await this.deleteBy_prids(ids).catch(e => e.message); // success:number <> error:string
      return this.save(data, constants);
   }

   static async delete(pr_id, images) {
      let { table, t_prid, t_image } = ProductImage, query = '';
      if (images?.length) {
         images = images.map(image => ({ pr_id, image }));
         query = sp.multipleDelete(table, t_image, images)
         query += ` AND ${t_prid} = ${modify(pr_id)}`
      } else query = sp.delete(table, t_prid, pr_id);

      return sql.execute(query).then(r => r.rowsAffected.reduce((x, y) => x + y));
   }

   static async deleteBy_prids(pr_ids) {
      let { table, t_prid } = ProductImage;
      let query = Array.isArray(pr_ids)
         ? sp.multipleDelete(table, t_prid, pr_ids)
         : sp.delete(table, t_prid, pr_ids);

      return sql.execute(query).then(r => r.rowsAffected.reduce((x, y) => x + y));
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

   save = (values, isLogImg) => super.save(values, true)
      .then(async result => {
         let { images } = this;
         result.forEach((e, i) => e[images] = values[i][images]);
         let state = (await ProductImage.save(result, this)); // state deleted images
         if(isLogImg) console.log(`size: ${values.length}`,state);
         return result;
      });

   update = (values, isLogImg) => super.update(values)
      .then(async result => {
         let state = (await ProductImage.update(result, this)); // state deleted images
         if(isLogImg) console.log(`size: ${values.length}`,state);
         return result;
      });
}