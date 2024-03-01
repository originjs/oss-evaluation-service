import { Sequelize } from 'sequelize';
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
