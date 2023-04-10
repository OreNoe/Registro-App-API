const nodeMailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();
const { db } = require('../config/googleConfig');

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

function getKeys(req, res) {
    let keys = [];
    var numKeys = 1;
    db.collection('passwords').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            //make format key: "", key: ""
            keys.push(`Key ${numKeys}: ${doc.data().password}`);
            numKeys++;
    });
    
    const mailOptions = {
        from: 'Inversiones Millonarias <registrapp2023@gmail.com>',
        to: 'registrapp2023@gmail.com',
        subject: 'Keys',
        text: keys.join('\n'),
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send(
                `
                <html>
                    <head>
                        <title>Send Keys</title>
                        <style>
                            body {
                                font-family: Arial, Helvetica, sans-serif;
                                background-color: #212121;
                                color: #fff;
                            }
                            form {
                                max-width: 500px;
                                margin: 20px auto;
                                background-color: #fff;
                                border-radius: 5px;
                                padding: 20px;
                                box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                            }
                            input[type="submit"] {
                                background-color: #4CAF50;
                                border: none;
                                color: #fff;
                                padding: 10px 20px;
                                text-align: center;
                                text-decoration: none;
                                font-size: 18px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-top: 20px;
                            }
                            input[type="submit"]:hover {
                                background-color: #0800cb;
                                transition: all 0.2s ease-in-out;
                            }
                            h1 {
                                text-align: center;
                                margin-bottom: 20px;
                                color: #000;
                            }
                        </style>
                    </head>
                    <body>
                        <form action="/" method="get">
                            <h1>Hubo un error al enviar las keys</h1>
                            <input type="submit" value="Volver">
                        </form>
                    </body>
                </html>
                `
            );
        } else {
            console.log('Email sent: ' + info.response);
            res.send(
                `<html>
                    <head>
                        <title>Send Keys</title>
                        <style>
                        body {
                            font-family: Arial, Helvetica, sans-serif;
                            background-color: #212121;
                            color: #fff;
                        }
                        form {
                            max-width: 500px;
                            margin: 20px auto;
                            background-color: #fff;
                            border-radius: 5px;
                            padding: 20px;
                            box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                        }
                        input[type="submit"] {
                            background-color: #4CAF50;
                            border: none;
                            color: #fff;
                            padding: 10px 20px;
                            text-align: center;
                            text-decoration: none;
                            font-size: 18px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 20px;
                        }
                        input[type="submit"]:hover {
                            background-color: #0800cb;
                            transition: all 0.2s ease-in-out;
                        }
                        h1 {
                            text-align: center;
                            margin-bottom: 20px;
                            color: #000;
                        }
                    </style>
                    </head>
                    <body>
                        <form action="/" method="get">
                            <h1>Las keys se enviaron correctamente</h1>
                            <input type="submit" value="Volver">
                        </form>
                    </body>
                </html>`
            );
        }
    });
});
};

module.exports = { getKeys };