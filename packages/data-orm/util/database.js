import { Sequelize } from 'sequelize';
import * as mysql from 'mysql2';

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialectOptions: {
      ssl: false,
    },
    pool: {
      max: 10,
      min: 0,
      idle: 20000,
    },
    dialectModule: mysql,
  },
);

export async function checkConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database Connected');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

export default sequelize;
