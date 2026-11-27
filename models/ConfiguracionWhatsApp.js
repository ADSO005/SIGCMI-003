import { DataTypes } from "sequelize";
import db from "../config/db.js";

// Fila única con la configuración de WhatsApp Cloud API.
// access_token, app_secret y verify_token se guardan cifrados (utils/cifrado.js).
const ConfiguracionWhatsApp = db.define(
    "ConfiguracionWhatsApp",
    {
        id_configuracion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        phone_number_id: DataTypes.STRING(40),
        waba_id: DataTypes.STRING(40),
        access_token: DataTypes.TEXT,
        app_secret: DataTypes.TEXT,
        verify_token: DataTypes.TEXT,
        api_version: { type: DataTypes.STRING(10), defaultValue: "v21.0" },
        codigo_pais: { type: DataTypes.STRING(5), defaultValue: "57" },
        activo: { type: DataTypes.BOOLEAN, defaultValue: false },
        numero_visible: DataTypes.STRING(30),
        nombre_verificado: DataTypes.STRING(120),
        ultima_verificacion: DataTypes.DATE,
        ultimo_error: DataTypes.TEXT,
        actualizado_por: DataTypes.INTEGER,
        actualizado_en: DataTypes.DATE,
    },
    { tableName: "configuracion_whatsapp", timestamps: false, freezeTableName: true }
);

export default ConfiguracionWhatsApp;
