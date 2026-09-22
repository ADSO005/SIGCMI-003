import jwt from "jsonwebtoken";

const generateJWT = (usuario) => {

    return jwt.sign(
        {
            id: usuario.id_usuario
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

};

export default generateJWT;