import { validationResult } from "express-validator";

// GET /auth/register
export const showRegisterForm = (req, res) => {
  res.render("viewsPaciente/register", {
    errors: {},
    formData: {},
  });
};

// POST /auth/register
export const register = async (req, res) => {
  const result = validationResult(req);

  // Si hay errores de validación
  if (!result.isEmpty()) {
    return res.status(400).render("viewsPaciente/register", {
      errors: result.mapped(),
      formData: req.body,
    });
  }

  // Aquí irá la lógica para guardar el usuario
  console.log("Nuevo usuario:", req.body);

  res.redirect("/auth/login");
};