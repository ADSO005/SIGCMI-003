import "dotenv/config";
import bcrypt from "bcrypt";

import db from "../config/db.js";
import Usuario from "../models/Usuario.js";
import Medico from "../models/Medico.js";
import Paciente from "../models/Paciente.js";
import Rol from "../models/Rol.js";
import Especialidad from "../models/Especialidad.js";

const usuarios = [
    {
        rol_id: 2,
        nombres: "Cristiano",
        apellidos: "Ríos",
        correo: "prueba@test.com",
        numero_documento: "TEST-MED-001",
    },
    {
        rol_id: 3,
        nombres: "Valentina",
        apellidos: "López",
        correo: "prueba.paciente@test.com",
        numero_documento: "TEST-PAC-001",
    },
    {
        rol_id: 1,
        nombres: "Anuel",
        apellidos: "Torres",
        correo: "prueba.admin@test.com",
        numero_documento: "TEST-ADM-001",
    },
];

async function seed() {
    try {
        // Evita ejecutar el seeder en una base distinta a la configurada.
        if (!process.env.DB_NAME) {
            throw new Error("Falta configurar DB_NAME en el archivo .env.");
        }

        if (db.getDatabaseName() !== process.env.DB_NAME) {
            throw new Error(
                "config/db.js no está usando la base indicada en DB_NAME."
            );
        }

        await db.authenticate();

        console.log(`Base seleccionada: ${db.getDatabaseName()}`);

        const passwordHash = await bcrypt.hash("Prueba123*", 10);

        // Si una operación falla, se revierten todos los cambios del seeder.
        const resultados = await db.transaction(async (transaction) => {
            for (const id of [1, 2, 3]) {
                const rol = await Rol.findByPk(id, { transaction });

                if (!rol) {
                    throw new Error(
                        `Falta el rol ${id}. Ejecuta primero las migraciones y la carga de roles.`
                    );
                }
            }

            const [especialidad] = await Especialidad.findOrCreate({
                where: { nombre: "Medicina General" },
                defaults: {
                    descripcion: "Atención médica general",
                },
                transaction,
            });

            const filas = [];

            for (const datos of usuarios) {
                const [usuario, creado] = await Usuario.findOrCreate({
                    where: { correo: datos.correo },
                    defaults: {
                        ...datos,
                        tipo_documento: "CC",
                        password: passwordHash,
                        confirmado: true,
                        estado: true,
                    },
                    transaction,
                });

                // Conserva los datos y la contraseña de usuarios existentes.
                if (Number(usuario.rol_id) !== datos.rol_id) {
                    throw new Error(
                        `El correo ${datos.correo} ya pertenece a otro rol.`
                    );
                }

                if (datos.rol_id === 2) {
                    await Medico.findOrCreate({
                        where: { usuario_id: usuario.id_usuario },
                        defaults: {
                            especialidad_id: especialidad.id_especialidad,
                            cedula_profesional: "TEST-PROF-001",
                            anios_experiencia: 5,
                        },
                        transaction,
                    });
                }

                if (datos.rol_id === 3) {
                    await Paciente.findOrCreate({
                        where: { usuario_id: usuario.id_usuario },
                        defaults: {
                            fecha_nacimiento: "2000-05-15",
                            departamento: "Risaralda",
                            ciudad: "Pereira",
                        },
                        transaction,
                    });
                }

                filas.push({
                    nombre: `${usuario.nombres} ${usuario.apellidos}`,
                    correo: usuario.correo,
                    rol: usuario.rol_id,
                    resultado: creado ? "Creado" : "Ya existía",
                });
            }

            return filas;
        });

        console.table(resultados);
        console.log("Seeder completado.");
        console.log("Contraseña de los usuarios nuevos: Prueba123*");
    } catch (error) {
        console.error("No se completó el seeder:", error.message);
        process.exitCode = 1;
    } finally {
        await db.close();
    }
}

await seed();