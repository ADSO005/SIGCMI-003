import { Sequelize } from 'sequelize';

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