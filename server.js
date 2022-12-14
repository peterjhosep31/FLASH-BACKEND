const express = require('express');
const mysql = require('mysql2');
const bcryptjs = require('bcryptjs');
const mycoon = require('express-myconnection');
const cors = require('cors');
const cookieParse = require('cookie-parser')
const nodemailer = require('nodemailer');

require('dotenv').config();

const app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.json());
app.use(cors());
app.use(cookieParse());

const dbOptions = {
    host: process.env.host_db,
    user: process.env.user_db,
    password: process.env.password_db,
    port: process.env.port_db,
    database: process.env.database_db
};

try {
    app.use(mycoon(mysql, dbOptions, 'single'));
    console.log("Conectado a la base de datos");
} catch (error) {
    console.log('------------------- ERROR -------------------');
    console.log(error);
    console.log('---------------------------------------------');
}

app.post('/login', async (req, res) => {
    console.log(req.body);
    let correo = req.body.correo;
    let password = req.body.password;
    req.getConnection((err, conn) => {
        if (!err){
            conn.query('SELECT passwords FROM usuarios WHERE correo=correo', [
                correo
            ], (err, rows) => {
                if(!err){
                    if(rows){
                        const validPassword = bcryptjs.compareSync(password, rows[0].passwords);
                        if(validPassword){
                            res.send('usuario logueado');
                        }else{
                            res.send('contraseña incorrecta');
                        }
                    }else{
                        res.send('usuario no existe');
                    }
                }
            })
        } else {
            console.log('------------------- ERROR CONNECT -------------------');
            console.log(err);
            console.log('---------------------------------------------');
        }

    })

})


app.post('/registro', async (req, res) => {
    let nombre = req.body.nombre + ' ' + req.body.apellido;
    let email = req.body.correo;
    let password = req.body.contrasena1;
    let passwordHash = await bcryptjs.hash(password, 10);
    let id = req.body.id;
    let telefono = req.body.telefono;
    let direccion = req.body.direccion;

    req.getConnection((err, conn) => {
        if (!err) {
            conn.query('INSERT INTO usuarios set ?', [{
                nombre: nombre,
                correo: email,
                passwords: passwordHash,
                checkPassword: password,
                telefono: telefono,
                direccion: direccion,
                id_cliente: id
            }], (err, rows) => {
                if (!err) {
                    console.log('usuario registrado');
                    const transporter = nodemailer.createTransport({
                        host: "smtp.gmail.com",
                        port: 587,
                        auth: {
                            user: '2022.flash.sale@gmail.com',
                            pass: "ynjzrmpxxxlnxapt",
                        },
                    });
                    transporter
                        .sendMail({
                            from: '2022.flash.sale@gmail.com',
                            to: email,
                            subject: `Hola! ${nombre}`,
                            html: `<h1>SU REGISTRO FUE EXITOSO</h1><br><p>Apreciado Usuario(a), el presente correo es para informar que ha sido registrado(a) correctamente en nuestro aplicativo web <b>FLASH sale</b> Esperamos que nuestra aplicación sea de su agrado y disfrute de todas las herramientas brindadas en esta web</p>`,
                        })
                        .then((res) => {
                            console.log("Email enviado");
                        })
                        .catch((err) => {
                            console.log("Error al enviar el email");
                            console.log(err);

                        });

                } else if (err.code == 'ER_DUP_ENTRY') {
                    res.send("<script>alert('El usuario ya existe'); window.location = 'http://localhost:3000/registre'</script>")
                    console.log("sierve");
                } else {
                    console.log('------------------- ERROR REGISTRE-------------------');
                    console.log(err);
                    console.log('---------------------------------------------');
                }
            })

        } else {
            console.log('------------------- ERROR CONNECT-------------------');
            console.log(err);
            console.log('---------------------------------------------');
        }

    })
})


app.listen(app.set('port'), () => {
    console.log('Server on port', app.set('port'));
});

