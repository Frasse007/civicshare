// Model registry. Import models from here so associations load once.
export { sequelize } from '../config/database.js';
export { User, ROLES } from './User.js';