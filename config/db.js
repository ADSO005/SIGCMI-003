import { Sequelize } from 'sequelize';

const db = new Sequelize(
    'sigcmi',      // Aqui nombre de Base de datos
    'root',        // Usuario de Base de datos
    '',            // Contraseña de tu mySQL
    {
        host: '127.0.0.1',
        port: 3306,
        dialect: 'mysql',
        define: {
            timestamps: false
        }
    }
);

export default db;