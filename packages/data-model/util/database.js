import { Sequelize } from 'sequelize';
import * as mysql from 'mysql2';
import logger from './logger.js';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: false,
  },
  pool: {
    max: 20,
    min: 0,
    idle: 20000,
  },
  dialectModule: mysql,
  logging: msg => logger.info(msg),
});

let sequelizeExt;
if (process.env.DATABASE_EXT_URL) {
  sequelizeExt = new Sequelize(process.env.DATABASE_EXT_URL, {
    dialectOptions: {
      ssl: false,
    },
    dialectModule: mysql,
    logging: msg => logger.info(msg),
  });
}

export async function checkConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database Connected');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
}

export { sequelize, sequelizeExt };
export default sequelize;
