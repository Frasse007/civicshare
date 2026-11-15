import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const CATEGORIES = Object.freeze(['Cleaning', 'Lawn & Garden', 'Ladders', 'Woodworking', 'Power Tools', 'Painting']);
export const CONDITIONS = Object.freeze(['Excellent', 'Good', 'Fair']);
export const STATUSES = Object.freeze(['available', 'borrowed', 'maintenance']);

/**
 * A piece of shared equipment. `status` doubles as the availability flag currently
 * TODO: derive live availability from reservations. Setting "maintenance" blocks future reservations.
 */
export class Tool extends Model {}

Tool.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.ENUM(...CATEGORIES), allowNull: false },
    condition: { type: DataTypes.ENUM(...CONDITIONS), allowNull: false, defaultValue: 'Good' },
    safetyRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: { min: 1, max: 5 },
    },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'available' }, // Default to tools being available
    emoji: { type: DataTypes.STRING(8), allowNull: false, defaultValue: '🔧' },
    pickupStation: { type: DataTypes.STRING(120), allowNull: false },
    latitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -90, max: 90 } },
    longitude: { type: DataTypes.DOUBLE, allowNull: false, validate: { min: -180, max: 180 } },
    /** Safety documentation shown on the tool profile (ordered lists of short strings). */
    safetyGuidelines: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    safetyGear: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    weatherSensitive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: 'Tool', tableName: 'tools' },
);
