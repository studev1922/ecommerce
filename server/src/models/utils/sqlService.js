import mssql from "mssql"
import dotenv from "dotenv"
import config from '../../configs/mssqlConfig.js';

const show = (dotenv.config().parsed?.SHOW_SQL == 'true') || false;

// Keep connection waiting to close
const sql = {
    connect: (await mssql.connect(config)),
    execute: async (query) => {
        if (show) console.log(query);
        return sql.connect.query(query);
    }
}

// Connect and close instantly
const request = async (query) => {
    const pool = (await mssql.connect(config)).request();
    if (show) console.log(query);
    return pool.query(query);
}

// Connect and close in this function;
const reseed = async (table, key) => {
    const pool = new mssql.ConnectionPool(config);
    const conn = await pool.connect();
    // the first session get max identity by id
    let query = `SELECT MAX(${key}) as max FROM ${table}`;
    const max = (await conn.query(query)).recordset[0]?.max || 1;
    // seconds session RESEED key identity
    query = `DBCC CHECKIDENT ('${table}', RESEED, ${max});`;
    return (await conn.query(query).finally(() => conn.close()));
}

// Connect and close in this function
/**
 * 
 * @param {String} objectName EX: console.log((await getFields('PRODUCTS')).recordset); 
 * @returns {Promise} all fields in object
 */
const getFields = async (objectName) => {
    const pool = new mssql.ConnectionPool(config);
    const conn = await pool.connect();
    let query = "SELECT c.object_id, c.name, t.name as 'type' \n\tFROM sys.columns c"
        + '\n\tINNER JOIN sys.all_objects o\n\t\tON o.object_id = c.object_id'
        + '\n\tINNER JOIN sys.types t\n\t\tON t.system_type_id = c.system_type_id'
        + `\nWHERE o.name = '${objectName}'`
    return (await conn.query(query).finally(() => conn.close()));
}

export { sql, reseed, getFields }
export default request;