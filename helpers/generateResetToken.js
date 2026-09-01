import jwt from "jsonwebtoken";

const generateResetToken = (usuario) => {

    return jwt.sign(
        {
            id: usuario.id_usuario,
            tipo: "password-reset"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "10m"
        }
    );

};

export default generateResetToken;