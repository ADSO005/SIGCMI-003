import express from "express";
import { recibirMensaje } from "../../controllers/whatsapp/whatsappController.js";
import { verificarWebhook, recibirWebhook } from "../../controllers/whatsapp/webhookController.js";

const router = express.Router();

router.post("/mensaje", recibirMensaje);

// Webhook de WhatsApp Cloud API (sin auth: Meta lo valida con verify token y firma).
router.get("/webhook", verificarWebhook);
router.post("/webhook", recibirWebhook);

export default router;
