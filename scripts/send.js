const nodeMailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'registrapp2023@gmail.com',
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});


function sendEmail(event, name, surname, id, date, location, encargado, mensajeMail, lvl) {
    const qrCode = "https://registra-app.uc.r.appspot.com/qr/photo/" + event + "/" +lvl +"/" + id;
    //send email to user and encargado
    console.log("Sending email to " + encargado);
    const mailOptions = {
        from: 'Inversiones Millonarias <registrapp2023@gmail.com>',
        to: encargado,
        subject: 'Entrada evento - ' + event + ' - ' + name + ' ' + surname,
        html : 
        //make a button that redirects to the website /qr/:event/:id
        `<p>¡Hola ${encargado}!</p>
        <p>El usuario ${name} ${surname} se ha registrado en el evento ${event}.</p>
        <p>Para enviar el mensaje a ${name}, haz click <a href="https://registra-app.uc.r.appspot.com/qr/${event}/${id}">aquí</a></p>
        <p>Saludos,</p>
        <p>Sino aqui se encuentra el mensaje por si no funciona el link</p>
        <p>¡Hola ${name} ${surname}!</p>
        <p>${mensajeMail} ${date} en ${location} en la ciudad de ${event}.</p>
        <p>Este es tu código QR para acceder al evento</p>
        <p>Recuerda tenerlo en tu teléfono al ingresar.</p>
        <p>Para más información puedes contactar a tu asesor.</p>
        <p>¡Nos vemos pronto!</p>
        ${qrCode}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Email sent to " + encargado);
        }
    });
}

module.exports = { sendEmail };