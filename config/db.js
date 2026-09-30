import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Creamos la conexión
const sequelize = new Sequelize(
    'sigcmi',
    'root',
    '1089930248',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

export default sequelize;