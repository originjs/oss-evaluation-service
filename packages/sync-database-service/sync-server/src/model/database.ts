import { Sequelize } from 'sequelize';
import * as mysql from 'mysql2';

const dbOps = new Sequelize(process.env.DATABASE_URL, {
  dialectOptions: {
    ssl: false,
  },
  pool: {
    max: 20,
    min: 0,
    idle: 20000,
  },
  dialectModule: mysql,
});

export { dbOps };
