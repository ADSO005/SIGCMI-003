import express from "express";
import { recibirMensaje } from "../../controllers/whatsapp/whatsappController.js";

const router = express.Router();

router.post("/mensaje", recibirMensaje);

export default router;