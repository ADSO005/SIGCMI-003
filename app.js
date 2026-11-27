import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===============================
// MIDDLEWARES
// ===============================
app.use(express.urlencoded({ extended: true }));

// rawBody se conserva para validar la firma del webhook de WhatsApp.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

app.use(cookieParser());

app.set("view engine", "pug");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));



export default app;