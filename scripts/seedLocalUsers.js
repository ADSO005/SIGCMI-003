import "dotenv/config";
import bcrypt from "bcrypt";

import db from "../config/db.js";
import { Usuario, Medico, Especialidad } from "../models/index.js";

const cuentas = [
    {
        nombres: "Anuel",
        apellidos: "Martínez",
        correo: "anuel.martinez@sigcmi.test",
        numero_documento: "900000001",
        rol_id: 1,
        password: process.env.SEED_ADMIN_PASSWORD,
    },
    {
        nombres: "Cristiano",
        apellidos: "Ronaldo",
        correo: "cristiano.ronaldo@sigcmi.test",
        numero_documento: "900000002",
        rol_id: 2,
        password: process.env.SEED_MEDICO_PASSWORD,
    },
];

async function main() {
    // Evitar ejecutar este script accidentalmente en otra base.
    if (process.env.DB_NAME !== "sigcmi") {
        throw new Error("Este script solo está preparado para la base local sigcmi.");
    }

    if (cuentas.some(cuenta => !cuenta.password)) {
        throw new Error("Configura las contraseñas SEED en el archivo .env.");
    }

    await db.authenticate();

    const especialidad = await Especialidad.findOne({
        where: { nombre: "Medicina General" },
    });

    if (!especialidad) {
        throw new Error("Primero debes registrar Medicina General.");
    }

    await db.transaction(async transaction => {
        for (const cuenta of cuentas) {
            const existente = await Usuario.findOne({
                where: { correo: cuenta.correo },
                transaction,
            });

            if (existente) {
                throw new Error(`El correo ${cuenta.correo} ya está registrado.`);
            }

            const passwordHash = await bcrypt.hash(cuenta.password, 10);

            const usuario = await Usuario.create(
                {
                    nombres: cuenta.nombres,
                    apellidos: cuenta.apellidos,
                    correo: cuenta.correo,
                    numero_documento: cuenta.numero_documento,
                    rol_id: cuenta.rol_id,
                    password: passwordHash,
                    confirmado: true,
                    estado: true,
                },
                { transaction }
            );

            if (cuenta.rol_id === 2) {
                await Medico.create(
                    {
                        usuario_id: usuario.id_usuario,
                        especialidad_id: especialidad.id_especialidad,
                        cedula_profesional: "MED-900000002",
                        anios_experiencia: 5,
                    },
                    { transaction }
                );
            }

            console.log(`Cuenta preparada: ${cuenta.nombres} ${cuenta.apellidos}`);
        }
    });

    console.log("Usuarios creados correctamente.");
}

main()
    .catch(error => {
        console.error("Error al crear usuarios:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.close();
    });