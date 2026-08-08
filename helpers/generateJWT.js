import jwt from "jsonwebtoken";

const generateJWT = (usuario) => {

    return jwt.sign(
        {
            id: usuario.id_usuario,
            rol: usuario.rol_id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

};

export default generateJWT;