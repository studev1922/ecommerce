import { MapData } from '../storage.js';
import sp from '../services/queryHelper.js';
import sql from '../services/sqlService.js';


export default class AbstractDAO {

   /**
    * @param {String} table named table
    * @param {String} primary filed name of id
    * @param {Array<String>} fields to insert and update into database
    * @param {MapData} data extends Map
    */
   constructor(table, primary, fields, data = new MapData()) {
      this.data = data;
      this.table = table;
      this.fields = fields;
      this.primary = primary;
   }

   /**
    * Get first data from database add to storage 
    */
   async pullList() {
      let { data, table, primary } = this;
      let query = sp.select(table);
      let result = (await sql.execute(query)).recordset;
      data.clear(); // begin clear all old data.
      data.sets(primary, result); // add all data.
   }

   /**
    * @param {Array<String>} fields to get only the fields in the data
    * @returns {Promise<MapData>} extends Map with fields mapped;
    */
   async getMap(fields) {
      let { data } = this;
      if (!data?.length) await this.pullList();
      return fields ? data.withFields(fields) : data;
   }

   /**
    * get all data by id
    * @param {any} ids of data, has one or array
    * @returns {Array || Object} list data has id equals with ids parameter
    */
   getByIds = (ids) => this.data.gets(ids);

   /**
    * insert all data to the database && set all into storage
    * <hr/>
    * @param {Array || Object} values 
    * @param {Boolean} isRecord to get recordsets || values
    * @returns {Promise<Array>} an Array inserted value
    */
   async save(values, isRecord) {
      let { table, fields, data, primary } = this;
      let isArray = data instanceof Map;
      let query = isArray
         ? sp.multipleInsert(table, values, fields)
         : sp.insert(table, values, fields);

      return sql.execute(query).then(r => {
         let result = isRecord ? r.recordsets.map(e => e[0])
            : isArray ? values : [values];
         data.sets(primary, result);
         return result;
      })
   }

   /**
    * update all to database && set all into storage
    * <hr/>
    * @param {Array || Object} values 
    * @returns {Promise<Array>} values of parameter if update successfully
    */
   async update(values, isRecord) {
      let { table, fields, primary, data } = this;
      let query = sp.update(table, values, fields, primary);

      return sql.execute(query).then(() => {
         let result = isRecord ? r.recordsets.map(e => e[0])
            : isArray ? values : [values];
         data.sets(primary, result);
         return result;
      })
   }

   /**
    * 
    * @param {any} ids delete all by ids
    * @returns {Promise<Number>} number of deleted data
    */
   async delete(ids) {
      let isArr = Array.isArray(ids);
      let { table, primary, data } = this;
      let query = isArr
         ? sp.multipleDelete(table, primary, ids)
         : sp.delete(table, primary, ids);

      return sql.execute(query).then(r => {
         data.deletes(ids);
         return r.rowsAffected.reduce((x, y) => x + y);
      })
   }
}