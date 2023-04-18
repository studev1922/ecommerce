const arrUtil = {
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
            if (column) for (let i in array) {
                let e = eval(`array[i]${column}`);
                if (values.includes(e)) indexes.push(Number.parseInt(i));
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
     * @param {Array} array 
     * @param {Array || Object} values 
     * @param {String} column 
     */
    update: (array, values, column) => {
        if (!array || !values || !column)
            throw `Prameters array || value || column maybe empty!`;

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

    /** G
     * 
     * @param {Array} array 
     * @param {Array || !Object} values 
     * @param {String} column 
     */
    delete: (array, values, column) => {
        const indexes = arrUtil.getIndexes(array, values, column);
        if (Array.isArray(indexes))
            for (let i of indexes) {
                array.splice(i, 1);
            }
        else if (indexes > -1) array.splice(indexes, 1);
    }
};

export { arrUtil };
export default {
    categories: new Array(),
    products: new Array()
};