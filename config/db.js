import { Sequelize } from 'sequelize';

// Creamos la conexión
const sequelize = new Sequelize(
    'sigcmi',
    'root',
    '',
    {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

export default sequelize;