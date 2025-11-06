import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Debug: mostrar variables de entorno cargadas
console.log('🔧 Database config:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'products_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Maguben237012!',
  dialect: 'mysql',
//   logging: process.env.NODE_ENV === 'development' ? console.log : false,
//   pool: {
//     max: 10,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
});

export default sequelize;
