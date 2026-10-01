import express from "express";
import auth from "../../middleware/auth.js";
import role from "../../middleware/role.js";

const router = express.Router();

router.get(
    "/dashboard",
    auth,
    role(2),
    (req, res) => {
        res.render("dashboardMedical/viewsMedico/dashboardMedical");
    }
);

export default router;