import crypto from "crypto";

const generarToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

export default generarToken;