import storage, { MapData } from '../models/storage.js';
import daoes from '../models/services/daoService.js';

console.log('compile...');
const dao = daoes.product;
const data = (await dao.getMap());
console.log(`got (${data.size}:${storage.products.size}) from storage.products`);
// console.log(`get by id: (${ids}) >>> `, dao.getByIds([1,4]));

async function testData(quantity = 1e2) {

   let logSize = async () => {
      let data = (await dao.getMap());
      let range = storage.products.size;
      console.log(`size >>> `, data.size,':', range);
   }

   let interval = setInterval(logSize, 5e2);

   async function randomData(qty = 1e3, array = new Set()) {
      let uids = Array.from((await daoes.user.getMap()).keys());
      let cgids = Array.from((await daoes.category.getMap()).keys());
      let imageData = [
         'https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png',
         'https://cdn.shopify.com/s/files/1/0137/6210/1348/collections/112991633508_1600x.jpg?v=1629297835',
         'https://wpassets.adda247.com/wp-content/uploads/multisite/sites/5/2022/06/05074905/world-environment-day.jpg'
      ];

      for (let i = 0; i < qty; i++) {
         let atu = Math.floor(Math.random() * uids.length);
         let atc = Math.floor(Math.random() * cgids.length);
         let imgSize = Math.floor(Math.random() * imageData.length);

         let subject = (Math.random() + 1).toString(36).substring(7);
         let note = Math.random().toString(36).substring(2);
         let price = parseFloat((Math.random() * 75.6).toFixed(2))
         let quantity = Math.floor(Math.random() + 50) + 5;
         let [u_id, c_id] = [uids[atu], cgids[atc]];
         let images = imageData.slice(0, imgSize);

         const data = { subject, note, price, quantity, u_id, c_id, images };
         array.add(data);
      }
      return array;
   }

   let values = Array.from(await randomData(quantity));
   let times = quantity.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
   let startTime = new Date().getTime();

   console.log(`prepare ${values.length} data.`);
   values = (await dao.save(values));
   await logSize();
   let prids = values.map(e => e.prid);
   console.log(`inserted ${prids.length} data.`);
   let result = (await dao.delete(prids));
   console.log(`deleted ${result} data.`);

   clearInterval(interval);
   console.log('clear interval');
   let endTime = new Date().getTime();
   console.log(`run ${times} times in ${(endTime - startTime) / 1E3} seconds!`);
}

await testData(1.2e3);

// let images = [
//    'https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png',
//    'https://cdn.shopify.com/s/files/1/0137/6210/1348/collections/112991633508_1600x.jpg?v=1629297835',
//    'https://wpassets.adda247.com/wp-content/uploads/multisite/sites/5/2022/06/05074905/world-environment-day.jpg'
// ]

// let dataImg = [];
// for(let i = 1; i < 2.5e3; i++) dataImg.push({prid: i, images})

// await dao.testImg(dataImg);