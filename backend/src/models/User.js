import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ROLES = Object.freeze({ MEMBER: 'member', ADMIN: 'admin' });

// A registered CivicShare account. Passwords are only ever stored as bcrypt hashes.
export class User extends Model {
  // Safe representation for API responses (never exposes passwordHash).
  toPublic() {
    const { id, name, email, role, createdAt } = this;
    return { id, name, email, role, createdAt };
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    role: {
      type: DataTypes.ENUM(...Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.MEMBER,
    },
  },
  { sequelize, modelName: 'User', tableName: 'users' },
);
