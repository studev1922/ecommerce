import sql from "../models/services/sqlService.js";
import daose from '../models/services/daoService.js';
import stg from '../models/storage.js';

console.log('compile...');
let deleteData = (await sql.execute(`delete users where uid not in ('admin', 'owner', 'staff', 'seller', 'user')`))
console.log(`deleted ${deleteData.rowsAffected} data from DB_ECOME.[USERS]`);
let dao = daose.user;
let data = (await dao.getList()); // the first load
const outData = [];

const testTimes = async (count, call, ...params) => {
   let times = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
   let startTime = new Date().getTime();
   for (let i = 0; i < count; i++) await call(...params);
   let endTime = new Date().getTime();
   console.log(`run ${times} times in ${(endTime - startTime) / 1E3} seconds!`);
}

// testTimes(1e6, async() => dao.getList()) // 1e7 ~ 6s


// await testTimes(1E5, async () => {
//    let fields = ['cgid', 'name', 'image', 'note'];
//    let j = Math.floor(Math.random() * fields.length) + 1;
//    let result = (await dao.getList(fields.slice(0, j)));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

// testTimes(1e5, () => {
//    let fields = data.map(e => e['cgid']);
//    let j = Math.floor(Math.random() * fields.length) + 1;
//    let result = dao.getByIds(fields.slice(0, j));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

// await testTimes(1e3, async () => {
//    let result = (await dao.update(data));
//    if (Array.isArray(data)) outData.push(...result);
//    else outData.push(result);
// })

const testUserData = async (qty = 2.5e2) => {

   let interval = setInterval(async () => {
      let data = (await dao.getList());
      console.log(`size >>>`, data.length);
   }, 1e3);

   async function randomData(array = new Set()) {
      let fields = (await daose.role.getList()).map(e => e.name);

      for (let i = 0; i < qty; i++) {
         let roles = fields.slice(0, Math.floor(Math.random() * fields.length) + 1);
         let password = (Math.random() + 1).toString(36).substring(7);
         let uid = (Math.random() + 1).toString(32).substring(5);
         const user = { uid, password, name: password, image: null, roles };
         array.add(user);
      }
      return array;
   }

   async function execute(users) {
      let times = qty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      let startTime = new Date().getTime();
      // REGISTER
      for (let user of users) {
         let { uid, password, name, image, roles } = user;
         await dao.register(uid, password, name, image, roles).catch(e => console.error(e.message));
      }
      // LOGIN
      for (let user of users) {
         let { uid, password } = user;
         await dao.login(uid, password).catch(e => console.error(e.message));
      }
      console.log(`register and login with ${users.size} data.`);

      // DELETE
      let uids = Array.from(users).map(e => e.uid);
      console.log(`deleted ${(await dao.delete(uids))} data!`);

      // REMAINING
      uids = (await dao.getList()).map(e => e.uid);
      console.log(`remaining ${uids.length} data in storage.users`, uids);

      clearInterval(interval);
      console.log('clear interval');
      
      let endTime = new Date().getTime();
      console.log(`run ${times} times in ${(endTime - startTime) / 1E3} seconds!`);
   }

   const users = (await randomData(new Set())); // prepare data
   execute(users); // execute test data
}

await testUserData(1e3); // average 50 accounts registered, loged and delete within 1 second 
// ################################################################## TEST AUTH

console.log(`end with ${outData.length} data output!`);