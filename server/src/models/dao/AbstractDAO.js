import sp from '../services/queryHelper.js';
import sql from '../services/sqlService.js';
import * as sp_arr from '../services/arrayHelper.js';

export default class AbstractDAO {

   constructor(table, primary, fields, data) {
      this.data = data;
      this.table = table;
      this.fields = fields;
      this.primary = primary;
   }

   async pullList() {
      let query = sp.select(this.table);
      let result = (await sql.execute(query)).recordset;
      while (this.data.length) this.data.pop();
      this.data.push(...result);
   }

   async getList(fileds) {
      let { data } = this;
      if (!data?.length) await this.pullList();
      return fileds ? sp_arr.mapData(data, fileds) : data;
   }

   getByIds(ids) {
      let { data, primary } = this;
      return sp_arr.default.getByValues(data, ids, primary);
   }

   async save(values) {
      let { table, fields, data } = this;
      let query = Array.isArray(data)
         ? sp.multipleInsert(table, values, fields)
         : sp.insert(table, values, fields);

      return sql.execute(query).then(() => {
         data.push(...values);
         return values;
      })
   }

   async update(values) {
      let { table, fields, primary, data } = this;
      let query = sp.update(table, values, fields, primary);

      return sql.execute(query).then(() => {
         sp_arr.default.update(data, values, `?.${primary}`);
         return values;
      })
   }

   async delete(ids) {
      let isArr = Array.isArray(ids);
      let { table, primary, data } = this;
      let query = isArr
         ? sp.multipleDelete(table, primary, ids)
         : sp.delete(table, primary, ids);

      return await sql.execute(query).then(r => {
         if (!isArr) ids = [ids];
         for (let i in ids) ids[i] = { [primary]: ids[i] };
         sp_arr.default.delete(data, ids, `?.${primary}`);
         return r.rowsAffected.map((x, y) => x + y);
      })
   }
}