import jwt from "jsonwebtoken";

const generateResetToken = (usuario, tokenReset) => {

    return jwt.sign(
        {
            id: usuario.id_usuario,
            tipo: "password-reset",
            jti: tokenReset
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "10m"
        }
    );

};

export default generateResetToken;