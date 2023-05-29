import AbstractDAO from './AbstractDAO.js';

export default class CategoryDAO extends AbstractDAO {
   constructor(storage) {
      const primary = 'cgid';
      super('[CATEGORIES]', primary, [primary, 'name', 'image', 'note'], storage);
   }
}