import { Sequelize } from 'sequelize';
import * as mysql from 'mysql2';

const innerSequelize = new Sequelize(process.env.INNER_DATABASE_URL, {
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

const outerSequelize = new Sequelize(process.env.OUTER_DATABASE_URL, {
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

export { innerSequelize, outerSequelize };
