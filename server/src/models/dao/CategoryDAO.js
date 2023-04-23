import AbstractDAO from './AbstractDAO.js';

export default class CategoryDAO extends AbstractDAO {
   constructor(arrayStorage = []) {
      const primary = 'cgid';
      if (!Array.isArray(arrayStorage)) arrayStorage = [];
      super('[CATEGORIES]', primary, [primary, 'name', 'image', 'note'], arrayStorage);
   }
}