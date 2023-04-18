import storage, { arrUtil } from '../storage.js';
import sp, { modify, query2 as _sp } from '../utils/queryHelper.js';
import { sql } from '../utils/sqlService.js';

export class ProductImage {
    static KEY = 'pr_id';
    static FIELDS = ['pr_id', 'image'];
    static TABLE = '[PRODUCT_IMAGES]';
    static GET_TOP = 10;

    getByPID = async (pr_ids) => {
        const [table, key, fields, top] = [
            ProductImage.TABLE,
            ProductImage.KEY,
            ProductImage.FIELDS,
            ProductImage.GET_TOP
        ];

        if (Array.isArray(pr_ids)) {
            const arr = [];
            for (const pr_id of pr_ids) {
                let query = sp.select(table, top, fields, `WHERE ${key}=${pr_id}`);
                arr.push({ pr_id, images: (await sql.execute(query)).recordset.map(e => e['image']) })
            } return arr;
        } else {
            const query = sp.select(table, top, fields, `WHERE ${key}=${pr_ids}`);
            return sql.execute(query).then(r => r.recordset.map(e => e.image));
        }
    };

    insert = async (pr_id, images, insertOnly) => {
        const [table, key, fields] = [ProductImage.TABLE, ProductImage.KEY, ProductImage.FIELDS];

        if (Array.isArray(images)) {
            images = Array.from(new Set(images)); // unique values
            for (const i in images) images[i] = { [key]: pr_id, image: images[i] }
        } else images = { [key]: pr_id, image: images };

        let query = sp.multipleInsert(table, images, fields);
        return sql.execute(query).then(r => insertOnly
            ? r.rowsAffected.reduce((x, y) => x + y) : images
        );
    };

    // delete by pr_id or (pr_id and image)
    delete = async (pr_ids, images) => {
        const [table, key] = [ProductImage.TABLE, ProductImage.KEY];
        const unique = !Array.isArray(pr_ids);
        const imgExist = Array.isArray(images);
        const _spAbsoluteDelete = (data) => {
            data = modify(data);
            let query = sp.delete(ProductImage.TABLE, ProductImage.KEY, pr_ids);
            let imgCondition = ' AND (';
            for (const image of data) imgCondition += `image=${image} OR `;
            imgCondition = `${imgCondition.substring(0, imgCondition.length - 3)})`;
            return query += imgCondition;
        }

        if (unique && imgExist) {
            const query = _spAbsoluteDelete(images);
            return sql.execute(query).then(r => r.rowsAffected[0]);
        } else if (unique) {
            const query = sp.delete(table, key, pr_ids);
            return sql.execute(query).then(r => r.rowsAffected[0]);
        } else {
            const query = sp.multipleDelete(table, key, pr_ids);
            return sql.execute(query).then(r => r.rowsAffected[0]);
        }
    };
}

export class CategoryDAO {
    static KEY = 'cgid';
    static FIELDS = [CategoryDAO.KEY, 'name', 'note', 'image'];
    static TABLE = '[CATEGORIES]';

    pullList = async () => {
        const [table, top, fields] = [CategoryDAO.TABLE, 1000, CategoryDAO.FIELDS];
        const query = sp.select(table, top, fields);
        await sql.execute(query).then(r => storage.categories = r.recordset);
        console.log(`GET ${storage.categories?.length} DATA FROM DATABASE`);
        return storage.categories;
    }

    getList = async () => {
        return storage.categories?.length ? storage.categories : this.pullList();
    };

    getByIds = async (ids) => {
        const [table, key] = [CategoryDAO.TABLE, CategoryDAO.KEY];
        let isArr = Array.isArray(ids); // prepare query
        let query = sp.select(table, null, null, 'WHERE(');

        if (isArr) { // add condition to read data by id
            for (let id of ids) query += `[${key}]='${id}' OR `;
            query = query.slice(0, query.length - 4) + ')' // splice last 'OR '
        } else query += `[${key}]='${ids}')`;

        // execute and modify users to get authorities and format password
        return sql.execute(query).then(r => isArr ? r.recordset : r.recordset[0]);
    }

    insert = async (data) => {
        const [table, fields, key] = [CategoryDAO.TABLE, CategoryDAO.FIELDS, CategoryDAO.KEY];
        const isArr = Array.isArray(data); // check object or array<object>
        const query = sp.multipleInsert(table, data, fields);
        const result = (
            await sql.execute(query).then(async _r => this.getByIds(
                isArr ? data.map(e => e[key]) : data[key]
            ))
        )

        return isArr
            ? storage.products.push(...result)
            : storage.products.push(result);
    }

    update = async (data) => {
        const [table, fields, key] = [CategoryDAO.TABLE, CategoryDAO.FIELDS, CategoryDAO.KEY];
        const isArr = Array.isArray(data); // check object or array<object>
        const query = sp.update(table, data, fields);
        const result = (
            await sql.execute(query).then(async _r => this.getByIds(
                isArr ? data.map(e => e[key]) : data[key]
            ))
        );

        return result;
    }

    delete = async (ids) => { // delete by single id or multiple id
        const [table, key] = [CategoryDAO.TABLE, CategoryDAO.KEY];
        let query = sp.multipleDelete(table, key, ids);
        return sql.execute(query).then(r => r.rowsAffected.map((x, y) => x + y));
    }

}

export class ProductDAO {
    static KEY = 'prid';
    static TABLE = '[PRODUCTS]'// primary key - fields - foreign keys
    static FIELDS = ['subject', 'note', 'price', 'quantity', 'u_id', 'c_id'];
    static RELATIONSHIP = 'VIEW_PRODUCTS';
    static RELATIONSHIP_FIELDS = [
        'images',
        'category.name', 'category.note', 'category.image',
        'user.name', 'user.image', 'user.access'
    ];

    static ACCESS = 'access'
    static IMAGE = 'images';

    static #heper = {
        getPage: (qty, page, isAccess) => {
            const [table, key, accessField] = [ProductDAO.RELATIONSHIP, ProductDAO.KEY, ProductDAO.ACCESS];
            const pageCondition = `ORDER BY ${key} OFFSET ${qty * page} ROWS FETCH NEXT ${qty} ROWS ONLY`;
            const accessCondition = `WHERE ${accessField}=${modify(isAccess)}`;

            return isAccess === undefined
                ? sp.select(table, null, null, pageCondition)
                : sp.select(table, null, null, accessCondition, pageCondition);
        }
    };

    #setProductRelationships = (data) => {
        if (!data) return [];

        for (let product of data) {
            let { images, user, category } = product;
            if (images) product.images = JSON.parse(images).map(e => e.image);
            if (user) {
                user = JSON.parse(user);
                user.password = user.password?.toString('base64');
                product.user = user;
            };
            if (category) product.category = JSON.parse(category);
        }
        return data;
    }

    #setProducts = async (data) => {
        const [key, image] = [ProductDAO.KEY, ProductDAO.IMAGE];

        if (!data) return [];
        for (const e of data) // get images by prid;
            e[image] = e[key] ? (await prdImgDAO.getByPID(e[key])) : []
        return data; // get roles by uid(username, u_id) and return modified users
    };

    #pullList = async (access, top, fields) => {
        const [table, accessField] = [ProductDAO.RELATIONSHIP, ProductDAO.ACCESS];
        fields = fields || [ProductDAO.KEY, ...ProductDAO.FIELDS, ...ProductDAO.RELATIONSHIP_FIELDS];

        const query = access == undefined
            ? sp.selectGraphFields(`\nFROM ${table}`, top, fields)
            : sp.selectGraphFields(`\nFROM ${table}`, top, fields,
                `WHERE ${accessField}=${modify(access)}`
            );

        return sql.execute(query).then(r => {
            console.log(`GET ${r.recordset?.length} DATA FROM DATABASE`);
            return this.#setProductRelationships(r.recordset);
        })
    }

    getRelationships = async (access, top, fields) => this.#pullList(access, top, fields)

    getRelationshipByIds = async (ids, access, top, columns) => {
        const [table, key] = [ProductDAO.RELATIONSHIP, ProductDAO.KEY];
        let isArr = Array.isArray(ids); // prepare query
        let query = sp.select(table, top, columns, 'WHERE(');

        if (isArr) { // add condition to read data by id
            for (let id of ids) query += `[${key}]='${id}' OR `;
            query = query.slice(0, query.length - 4) + ')' // splice last 'OR '
        } else query += `[${key}]='${ids}')`;

        if (typeof access != 'undefined') query += ` AND access=${modify(access)}`

        // execute and modify users to get authorities and format password
        return sql.execute(query).then(async r => isArr
            ? (await this.#setProductRelationships(r.recordset)) || []
            : (await this.#setProductRelationships(r.recordset))[0] || {}
        );
    }

    getPage = async (qty, page, access) => {
        let query = ProductDAO.#heper.getPage(qty, page, access);
        return sql.execute(query).then(r => this.#setProductRelationships(r.recordset));
    }

    getList = async (access, top, fields) => {
        const [table, accessField] = [ProductDAO.TABLE, ProductDAO.ACCESS];
        const query = access == undefined ? sp.select(table, top, fields)
            : sp.select(table, top, fields, `WHERE ${accessField}=${modify(access)}`);

        return sql.execute(query).then(r => r.recordset);
    };

    getByIds = async (ids, access) => {
        const [table, key] = [ProductDAO.TABLE, ProductDAO.KEY];
        let isArr = Array.isArray(ids); // prepare query
        let query = sp.select(table, null, null, 'WHERE(');

        if (isArr) { // add condition to read data by id
            for (let id of ids) query += `[${key}]='${id}' OR `;
            query = query.slice(0, query.length - 4) + ')' // splice last 'OR '
        } else query += `[${key}]='${ids}')`;

        if (typeof access != 'undefined') query += ` AND access=${modify(access)}`

        // execute and modify products to get images and format data
        return sql.execute(query).then(async r => isArr
            ? (await this.#setProducts(r.recordset)) || []
            : (await this.#setProducts(r.recordset))[0] || {}
        );
    }

    insert = async (data) => {
        const [table, key, fields, image] = [
            ProductDAO.TABLE, ProductDAO.KEY,
            ProductDAO.FIELDS, ProductDAO.IMAGE
        ];
        const isArr = Array.isArray(data); // check object or array<object>
        const query = sp.insert(table, data, fields);

        return sql.execute(query).then(async r => { // insert success > insert images
            const result = r.recordsets.map(e => e[0]); // get all recordsets
            for (const i in result) {// check type of data and get image
                const images = isArr ? data[i][image] : data[image];
                // past images to product and don't get result
                await prdImgDAO.insert(result[i][key], images, true)
                    .then(_r => result[i][image] = images)
                    .catch(_err => result[i][image] = []);
            }


            if (isArr) storage.products.push(...result)
            else storage.products.push(result);

            return isArr ? result : result[0];
        });
    }

    update = async (data) => {
        const [table, key, fields, image] = [
            ProductDAO.TABLE, ProductDAO.KEY,
            ProductDAO.FIELDS, ProductDAO.IMAGE
        ];
        const isArr = Array.isArray(data);
        const query = sp.update(table, data, fields, key);
        const ids = isArr ? data.map(e => e[key]) : data[key];
        const updateImg = async (key, images) => {
            if (images?.length) {
                await prdImgDAO.delete(key).catch(err => console.error(err.message));
                await prdImgDAO.insert(key, images, true).catch(err => console.error(err.message));
            } return;
        }

        // images already exists => delete data images
        if (isArr) data.forEach(async e => updateImg(e[key], e[image]))
        else updateImg(data[key], data[image]);
        return sql.execute(query).then(async _r => this.getByIds(ids));
    }

    setAccess = async (ids, access) => {
        const [table, key] = [ProductDAO.TABLE, ProductDAO.KEY];
        let query = _sp.toggleAccess(table, key, ids, access)

        return sql.execute(query).then(async r => r.rowsAffected[0]);
    }

    delete = async (ids) => { // delete by single id or multiple id
        const [table, key] = [ProductDAO.TABLE, ProductDAO.KEY];
        let query = sp.multipleDelete(table, key, ids);

        return sql.execute(query).then(r => r.rowsAffected.map((x, y) => x + y));
    }

}

const prdImgDAO = new ProductImage();
const categoryDAO = new CategoryDAO();
export { prdImgDAO, categoryDAO };
export default new ProductDAO();