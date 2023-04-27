export class MapData extends Map {

    /**
     * @param {Array<String>} keys forget all data within keys
     * @returns value || Array<values>
     */
    gets(keys) {
        if (Array.isArray(keys)) {
            let data = new Array();
            for (let key of keys) data.push(this.get(key))
            return data;
        } else return this.get(keys);
    }

    /**
     * 
     * @param {String} primary is an field in values
     * @param {Array<Object>} values for set all data
     */
    sets(primary, values) {
        if (Array.isArray(values)) {
            for (let value of values)
                this.set(value[primary], value);
        } else this.set(values[primary], values);
    }

    /**
     * @param {Array<String>} keys for delete all data within keys
     */
    deletes(keys) {
        if (Array.isArray(keys))
            for (let key of keys)
                this.delete(key);
        else this.delete(keys);
    }

    /**
     * @param {String} primary to set new map
     * @param {Array<String>} fields to map data 
     * @returns an Array mapped
     */
    withFields(primary, fields) {
        if (fields.includes(primary)) throw `cannot remove the key={${primary}} from the map!`;
        let data = new MapData();
        let compile = (_e) => eval(`let{${fields}}=_e;_e={${fields}};`);
        data.sets(primary, Array.from(this).map(e => compile(e)))
        return data;
    }
}

export default {
    categories: new MapData(),
    products: new MapData(),
    users: new MapData(),
    roles: new MapData(),
}