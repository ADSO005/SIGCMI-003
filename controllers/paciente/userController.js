
/* ruta de la vista principal inicio de sesion */
const formLogin = (req, res) => {

    res.render("login/auth/login", {
        titulo: "Iniciar Sesión"
    });
};

/* ruta de la vista recuperar contraseña */
const formRecoverPassword = (req, res) => {

    res.render("login/auth/recover-password", {
        titulo: "Recuperar contraseña"
    });
};


export {
    formLogin,
    formRecoverPassword
};





