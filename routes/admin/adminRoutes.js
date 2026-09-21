import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    role(1),
    (req, res) => {

        res.send("Dashboard Administrador");

    }
);

export default router;