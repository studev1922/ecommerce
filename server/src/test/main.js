import daoes from '../models/services/daoService.js';

console.log('compile...');
const dao = daoes.product;
let ids = [1, 4];
let data = (await dao.getList());
console.log(`get by id: (${ids}) >>> `, dao.getByIds(ids));
console.log(`got ${data.length} from storage.products`);