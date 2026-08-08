import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// Leer formularios HTML
app.use(express.urlencoded({ extended: true }));

// Leer JSON
app.use(express.json());

// Leer cookies
app.use(cookieParser());

// Archivos estáticos
app.use(express.static("public"));

export default app;