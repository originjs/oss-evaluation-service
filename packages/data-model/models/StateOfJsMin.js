import { DataTypes } from 'sequelize';
import sequelize from '../util/database.js';

export default sequelize.define(
  'StateOfJs',
  {
    year: {
      type: DataTypes.INTEGER,
    },
    satisfactionPercentage: {
      type: DataTypes.FLOAT,
    },
  },
  {
    tableName: 'state_of_js_detail',
    underscored: true,
  },
);
