import { Sequelize } from 'sequelize';
import debug from 'debug';

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialectOptions: {
    },
    pool: {
      max: 10,
      min: 0,
      idle: 20000,
    },
  },
);

export async function checkConnection() {
  try {
    await sequelize.authenticate();
    debug.log('Database Connected');
  } catch (error) {
    debug.error('Unable to connect to the database:', error);
  }
}

export default sequelize;
