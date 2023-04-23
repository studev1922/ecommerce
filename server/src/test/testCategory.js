import sql from "../models/utils/sqlService.js";
import CategoryDAO from "../models/dao/categoryDAO.js";

console.log('compile...');
let dao = new CategoryDAO();
let data = await dao.getList(); // the first load
const outData = [];

const testTimes = async (count, call) => {
   let times = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
   let startTime = new Date().getTime();
   for (let i = 0; i < count; i++) await call();
   let endTime = new Date().getTime();
   console.log(`run ${times} times in ${(endTime - startTime) / 1E3} seconds!`);
}

// await testTimes(1E5, async () => {
//    let fileds = ['cgid', 'name', 'image', 'note'];
//    let j = Math.floor(Math.random() * fileds.length) + 1;
//    let result = (await dao.getList(fileds.slice(0, j)));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

// testTimes(1e5, () => {
//    let fileds = data.map(e => e['cgid']);
//    let j = Math.floor(Math.random() * fileds.length) + 1;
//    let result = dao.getByIds(fileds.slice(0, j));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

// await testTimes(1e3, async () => {
//    let result = (await dao.update(data));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

console.log(`end with ${outData.length} data output!`);