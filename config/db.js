import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Creamos la conexión
const sequelize = new Sequelize(
    'sigcmi',
    'root',
    'Karen1030140161',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

export default sequelize;