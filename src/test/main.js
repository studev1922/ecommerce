import storage from '../models/storage.js';
import daoes from '../models/services/daoService.js';

console.log('compile...');
const dao = daoes.user;
const data = (await dao.getMap());
console.log(`got (${data.size}:${storage.users.size}) from storage.users`);

async function randomData(size = 1e3) {
   let roles = Array.from(await daoes.role.getMap()).map(e => e[1].name);
   const rData = [];

   for (let i = 0; i < size; i++) {
      let uid = (Math.random() + 1).toString(36).substring(7);
      let password = Math.random().toString(36).substring(2);
      rData.push({ uid, password, name: password, image: null, roles });
   }
   return rData;
}

async function execute(quantity = 1e3) {

   let result = (await randomData(quantity));
   let times = quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
   let startTime = new Date().getTime(); // log once in 3 seconds

   let logSize = async () => console.log(`size >>> (${data.size}:${(await dao.getMap()).size}) data.`);
   let interval = setInterval(logSize, 3e3);

   console.log(`prepare ${result.length} data for insert.`);
   // result.forEach(async user => await dao.register(...Object.values(user)).catch(e => console.error(e.message)))
   await dao.save(result).catch(e => console.error(e.message))
   console.log(`inserted ${result.length} data.`);
   logSize();

   result.forEach(async ({ uid, password }) => await dao.login({ uid, password }).catch(err => console.error(err.message)));
   console.log(`logged ${result.length} data.`);
   logSize();

   await randomData(result.length).then(res => { res.forEach((e, i) => e.uid = result[i].uid); result = res; });
   console.log(`prepare ${result.length} data for update.`);
   await dao.update(result).then(res => result = res).catch(e => console.error(e.message));
   console.log(`updated ${result.length} data.`);
   logSize();

   console.log(`delete ${(await dao.delete(result.map(e => e.uid)))} data.`);
   logSize();

   clearInterval(interval);
   console.log('Clear interval!');

   let endTime = new Date().getTime();
   console.log(`run ${times} times in ${(endTime - startTime) / 1E3} seconds!`);
}

execute(1e3);