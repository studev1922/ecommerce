import storage from '../storage.js';
import UserDAO from '../dao/UserDAO.js';
import AuthorityDAO, { RoleDAO } from '../dao/AuthorityDAO.js';
import ProductDAO from '../dao/ProductDAO.js';
import CategoryDAO from '../dao/CategoryDAO.js';

const { categories, products, roles, users } = storage;
const daose = {
   auth: new AuthorityDAO(),
   user: new UserDAO(users),
   role: new RoleDAO(roles),
   product: new ProductDAO(products),
   category: new CategoryDAO(categories)
};


export { CategoryDAO, ProductDAO, UserDAO, AuthorityDAO, RoleDAO }
export default daose;