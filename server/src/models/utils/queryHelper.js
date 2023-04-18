import moment from 'moment'

const util = {
    // Single insert by row
    insert: (table, keys, values) => {
        keys = keys.join('\x2c'); // get values by keys
        eval(`const{${keys}}=values; values=Object.values({${keys}}).join('\x2c')`);
        return `INSERT INTO ${table}(${keys}) VALUES(${values});\n`;
    },
    // Single update by row
    update: (table, keys, values, _id) => {
        let query = `UPDATE ${table} SET`;
        for (let k of keys) query += ` ${k}=${(values[k] == null) ? 'NULL' : values[k]},`;
        return `${query.slice(0, query.length - 1)} WHERE ${_id || keys[0]}=${values[_id || keys[0]]};\n`;
    },
    /**
     * 
     * @param {String} _table is table name
     * @param {Object | Array} _data
     * @param {Array<String>} _keys to set insert into || set update by key
     * @param {String} type 'insert' || 'update' values
     * @param {String} _id name of ID to update or defaulr is _keys[0]
     * @returns {String} newly created query 
     */
    evaluate: (_table, _data, _keys, type, _id) => {
        let query = new String();
        eval(`
            if (Array.isArray(_data)) {
                for (let e of _data)
                    query += util.${type}(_table, _keys || Object.keys(e), modify(e), _id);
            } else query = util.${type}(_table, _keys || Object.keys(_data), modify(_data), _id);
        `);
        return query;
    }
}
// modify data to mssql data
const modify = (data) => {
    if (data === null) return 'NULL';
    else if (Array.isArray(data)) {
        data = Object.assign([], data);// to avoid overwriting
        for (const i in data) data[i] = modify(data[i]); // set for array
        return data;
    } else switch (typeof data) { // type check to return corresponding data
        case 'string': return `N'${data}'`;
        case 'boolean': case 'undefined': return data ? 1 : 0;
        case 'object':
            if (data instanceof Date) return `'${date.format(data)}'`;
            data = Object.assign({}, data); // to avoid overwriting
            if (data.type) return data.type.replace('?', data.value);
            else for (const i of Object.keys(data)) data[i] = modify(data[i]) // set for object
            return data;
        default: return data;
    }
}
const date = {
    format: (data, format) => moment(data).format(format || 'YYYY-MM-DD HH:mm:ss.SSS'),
    setTo: (entity, key, format) => entity[key] = date.format(entity[key], format)
}
const query = {
    procedure: (proceName, data) => `EXECUTE ${proceName} ${modify(data)}`,

    /**
     * @param {String} table name to select 
     * @param {...any} serials to join query
     * @returns select query by table
     */
    select: (table, top, fields, ...serials) =>
        `SELECT${top ? ` TOP ${top}` : ''} ${fields || '*'} ${table.includes('FROM') ? table : `FROM ${table}`} ${serials.join('\xa0')}`,

    /**
     * @param {String} table the table name
     * @param {Number} top is quantity of rows to select
     * @param {String || Array<String>} fields are columns(fileds) of query selector
     * @param  {...any} serials append last query
     * @returns {String} query language
     */
    selectGraphFields: (table, top, fields, ...serials) => {
        if (!Array.isArray(fields)) fields = fields.split(',');
        const jsonObject = []; // json_values in json_object
        const addJsonValue = (obj, value) => `\n\t\t'${value}': JSON_VALUE([${obj}], '$.${value}'),`;
        const lastPush = "jsonObject.push(`${textQL.substring(0, textQL.length - 1)}\n\t) AS '${cusor}'`);";
        let textQL, cusor, continues;

        for (let i = 0, temp; i < fields.length;)
            if (fields[i].includes('.')) {
                temp = fields.splice(i, 1)[0]?.split('.');
                if (cusor == undefined && (cusor = temp[0])) {
                    textQL = `\n\tJSON_OBJECT(${continues || ''}`;
                    textQL += addJsonValue(...temp); // THE FIRST JSON_VALUE INTO JSON OBJECT
                    continues = undefined;
                } else if (temp[0] == cusor) {
                    textQL += addJsonValue(...temp); // JSON_VALUES CONTINUES
                } else {
                    eval(lastPush); // ADD LAST JSON_OBJECT QUERY
                    cusor = undefined; // clear to set first JSON_OBJECT
                    continues = addJsonValue(...temp); // for next JSON_OBJECT
                }
            } else ++i;
        eval(lastPush);
        fields.push(...jsonObject);

        return query.select(table, top, fields, ...serials);
    },
    
    /**
     * @param {String} table name to insert
     * @param {Object | Array} data to insert into ...
     * @param {Array<String>} keys to set insert into
     * @returns insert query by table
     */
    insert: (table, data, keys) => util.evaluate(table, data, keys, 'insert'),
    
    /**
     * 
     * @param {String} table name to update
     * @param {Object | Array} data for update
     * @param {Array<String>} keys to set update data
     * @param {String} fieldId field's name of ID or default by keys[0]
     * @returns query to update
     */
    update: (table, data, keys, fieldId) => util.evaluate(table, data, keys, 'update', fieldId), // field's name of ID
    
    /**
     * 
     * @param {String} table to delete data
     * @param {String} key field's name
     * @param {any} ids to delete
     * @returns query to delete
     */
    delete: (table, key, ids) => {
        let query = new String();
        if (Array.isArray(ids))
            for (let id of modify(ids))
                query += `DELETE FROM ${table} WHERE ${key} = ${id}\n`;
        else query += `DELETE FROM ${table} WHERE ${key} = ${modify(ids)}\n`;
        return query;
    },

    /**
     * EX: INSERT INTO [TABLE]([id],[name]) VALUES (1, 'abc'),(2, 'def'),(3, 'ghi')
     * 
     * @param {String} table to insert
     * @param {Object | Array} data to create insert query
     * @param {Array<String>} fields to set insert data
     * @returns insert query
     */
    multipleInsert: (table, data, fields) => {
        let query = `INSERT INTO ${table}(${fields}) VALUES\n`;
        const compileInsert = `const{${fields}}=e; e=Object.values({${fields}}).join('\x2c')`

        data = modify(data);
        if (Array.isArray(data)) {
            for (let e of data) {
                eval(compileInsert);
                query += `(${e}),\n`
            } return query.substring(0, query.length - 2);
        } else {
            let e = data;
            eval(compileInsert);
            return query += `(${e})`;
        }
    },

    multipleDelete: (table, key, ids) => {
        let query = `DELETE FROM ${table} WHERE`
        ids = modify(ids);
        for (const id of ids) query += ` ${key}=${id}\n OR`;
        query = query.substring(0, query.length - 3);
        return query;
    }
}
const query2 = {
    toggleAccess: (table, key, ids, access) => {
        const condition = ` OR ${key}=`;
        const [isArr, set] = [Array.isArray(ids), 'access'];
        const query = `UPDATE ${table} SET ${set}=${modify(access)} WHERE\n${key}=`;
        return query + (isArr ? modify(ids).join(condition) : modify(ids));
    }
}
export default query;
export { modify, date, query2 }