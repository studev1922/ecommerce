const crudData = {

    /**
     * 
     * @param {Array} array to filter values
     * @param {any} values are Array or primitive data type
     * @param {string} key named field of object to find
     * @returns {Array} in @param array found by @param values
     */
    getByValues: (array, values, key) => {
        if (!array || !key)
            throw `Prammeters array, key cannot be empty!`;
        else if (Array.isArray(values)) {
            return array.filter(e => {
                for (let id of values) if (e[key] == id) return e;
            })
        } else return array.filter(e => values == e[key])[0] || {};
    },

    /**
     * @param {Array<any>} array 
     * @param {any} values to get any index 
     * @param {String || undefined} column
     * 
     * @returns {Array || Number} all indexes of values in array
     */
    getIndexes: (array, values, column) => {
        if (!array) throw `Array param is undefined!`;

        if (Array.isArray(values)) {
            const indexes = [];
            if (column) {
                values = values.map(_e => eval(`_e${column}`));
                for (let i in array) {
                    let e = eval(`array[i]${column}`);
                    if (values.includes(e))
                        indexes.push(Number.parseInt(i));
                }
            } else for (let i in array) {
                if (values.includes(array[i]))
                    indexes.push(Number.parseInt(i));
            }
            return indexes;
        } else if (!column) return array.indexOf(values);
        else return array.findIndex(_e => eval(`_e${column}`) == values);
    },

    /**
     * 
     * @param {Array} array update in this array
     * @param {Array || Object} values to update
     * @param {String} column update by column condition
     */
    update: (array, values, column) => {
        if (!array || !values || !column)
            throw `Prameters array || values || column cannot be empty!`;

        if (Array.isArray(values))
            for (let i in array) {
                const value = eval(`array[i]${column}`);
                for (let _j in values) {
                    const e = values[_j];
                    if (value == eval(`e${column}`))
                        array[i] = e;
                }
            }
        else for (let i in array) {
            const value = eval(`array[i]${column}`);
            if (value == eval(`values${column}`)) array[i] = values;
        }
    },

    /**
     * 
     * @param {Array} array 
     * @param {Array || !Object} values 
     * @param {String} column 
     */
    delete: async (array, values, column) => {
        let [count, indexes] = [0, crudData.getIndexes(array, values, column)];
        if (Array.isArray(indexes))
            for (let i of indexes) array.splice(i - count++, 1);
        else if (indexes > -1) array.splice(indexes, 1);
    }
};

const mapData = (data, fields) => {
    let compile = (_e) => eval(`let{${fields}}=_e;_e={${fields}};`);
    return Array.isArray(data) ? data.map(e => compile(e)) : compile(data);
}

export { mapData };
export default crudData;