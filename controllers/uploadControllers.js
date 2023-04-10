const xlsx = require('xlsx');
const fs = require('fs');
const {db, sheets, sheetId} = require('../config/googleConfig');


const {sendEmail} = require('../scripts/send.js');

function uploadFileGet (req, res)  {
    let events = [];
    db.collection('events').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            events.push(doc.id);
        });
        //send a form to upload a file to storageFirebase and also the event name
        res.send(
            `<html>
            <head>
                <title>Upload File</title>
                <style>
                    body {
                        font-family: Arial, Helvetica, sans-serif;
                        background-color: #212121;
                        color: #fff;
                    }
                    form {
                        max-width: 60%;
                        margin: 20px auto;
                        background-color: #fff;
                        border-radius: 5px;
                        padding: 20px;
                        box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                    }
                    label {
                        display: block;
                        font-size: 18px;
                        margin-bottom: 5px;
                        color: #000;
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
                    input[type="text"] {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        box-sizing: border-box;
                        font-size: 18px;
                        margin-bottom: 20px;
                    }
                    input[type="password"] {
                        width: 100%;
                        padding: 10px;
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        box-sizing: border-box;
                        font-size: 18px;
                        margin-bottom: 20px;
                    }
                    input[type="file"] {
                        font-size: 16px;
                        padding: 5px;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                        width: 100%;
                        margin-bottom: 10px;
                        color: #000;
                        background-color: #fff;
                    }
                    select {
                        font-size: 16px;
                        padding: 5px;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                        width: 100%;
                        margin-bottom: 10px;
                    }
                    h1 {
                        font-size: 20px;
                        margin-bottom: 10px;
                        color: #000;
                    }
                    table {
                        font-family: arial, sans-serif;
                        border-collapse: collapse;
                        max-width: 100%;
                    }
                    td, th {
                        border: 1px solid #dddddd;
                        text-align: left;
                        padding: 8px;
                        color: #000;
                    }
                    tr:nth-child(even) {
                        background-color: #dddddd;
                        color: #000;
                    }
                </style>
            </head>
            <body>
            
            <form action="/uploadFile" method="post" enctype="multipart/form-data">
                <h1>Formato</h1>
                <table>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Nivel</th>
                        <th>Telefono</th>
                        <th>Status</th>
                        <th>Asesor</th>
                        <th>Observaciones</th>
                    </tr>
                </table>
                <h1>Archivo</h1>
                <input type="file" name="file" id="file">
                <h1>Evento</h1>
                <select name="event">
                    ${events.map(event => `<option value="${event}">${event}</option>`)}
                </select>
                <h1>Contraseña</h1>
                <input type="password" name="password" id="password">
                <input type="submit" value="Upload">
            </form>
            </body>
            </html>`
        );
    })
    .catch((error) => {
        console.log(error);
        res.send(
            `<p>Error obteniendo los eventos</p>
            <form action="/" method="get">
                <input type="submit" value="Volver">
            </form>`
        );
    });
};

function uploadFilePost(req, res) {
    let passwordCorrect = false;
    //get the file from storage
    const password = req.body.password;

    db.collection('passwords').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (doc.data().password === password) {
                passwordCorrect = true;
                console.log('password correct');
            
                console.log(req.file);
                const file = req.file;
                if (!file) {
                    res.send(
                        `<html>
                        <head>
                            <title>Upload File</title>
                            <style>
                                body {
                                    font-family: Arial, Helvetica, sans-serif;
                                    background-color: #212121;
                                    color: #fff;
                                }
                                form {
                                    max-width: 60%;
                                    margin: 20px auto;
                                    background-color: #fff;
                                    border-radius: 5px;
                                    padding: 20px;
                                    box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                                }
                                label {
                                    display: block;
                                    font-size: 18px;
                                    margin-bottom: 5px;
                                    color: #000;
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
                            </style>
                        </head>
                        <body>
                            <form action="/" method="get">
                                <label>No se selecciono ningun archivo</label>
                                <input type="submit" value="Volver">
                            </form>
                        </body>
                        </html>`
                    );
                    return;
                }
                const event = req.body.event;
                const workbook = xlsx.readFile(file.path);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                if (!sheet) {
                    res.send(
                        `<html>
                        <head>
                            <title>Upload File</title>
                            <style>
                                body {
                                    font-family: Arial, Helvetica, sans-serif;
                                    background-color: #212121;
                                    color: #fff;
                                }
                                form {
                                    max-width: 60%;
                                    margin: 20px auto;
                                    background-color: #fff;
                                    border-radius: 5px;
                                    padding: 20px;
                                    box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                                }
                                label {
                                    display: block;
                                    font-size: 18px;
                                    margin-bottom: 5px;
                                    color: #000;
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
                            </style>
                        </head>
                        <body>
                            <form action="/" method="get">
                                <label>No hay datos en el archivo</label>
                                <input type="submit" value="Volver">
                            </form>
                        </body>
                        </html>`
                    );
                    return;
                }

                const data = xlsx.utils.sheet_to_json(sheet);

                sheets.spreadsheets.values.append({
                    spreadsheetId: sheetId,
                    range: event + '!A1',
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: data.map(row => [row.Nombre, row.Apellido, row.Nivel, row.Telefono || '' ,'' , row.Asesor, row.Observaciones || '']),
                    },
                }, (err, res) => {
                    if (err) return console.log('Error copiando datos: ' + err);
                });

                //get the event data from the db
                var date = "";
                var location = "";
                db.collection('events').doc(event).get().then((doc) => {
                    date = doc.data().date;
                    location = doc.data().location;
                }).catch((error) => {
                    console.log("Error getting document:", error);
                });

                //add the data to the db
                data.forEach(row => {
                    db.collection("events").doc(event).collection("users").add({
                        name: row.Nombre,
                        surname: row.Apellido,
                        lvl: row.Nivel,
                        phone: row.Telefono || '',
                        active: true,
                        encargado: row.Asesor,
                        observaciones: row.Observaciones || '',
                    }).then((docRef) => {
                        const id = docRef.id;
                        db.collection('mailBody').doc('body').get().then((doc) => {
                            const mailBody = doc.data().body;
                            const image = doc.data().image;
                            sendEmail(event, row.Nombre, row.Apellido, id, date, location, row.Asesor, mailBody, row.Nivel);
                        });
                    });
                });
                res.send(
                    `<html>
                        <head>
                            <title>Upload File</title>
                            <style>
                                body {
                                    font-family: Arial, Helvetica, sans-serif;
                                    background-color: #212121;
                                    color: #fff;
                                }
                                form {
                                    max-width: 60%;
                                    margin: 20px auto;
                                    background-color: #fff;
                                    border-radius: 5px;
                                    padding: 20px;
                                    box-shadow: 0px 0px 10px rgba(0,0,0,0.2);
                                }
                                label {
                                    display: block;
                                    font-size: 18px;
                                    margin-bottom: 5px;
                                    color: #000;
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
                            </style>
                        </head>
                        <body>
                            <form action="/" method="get">
                                <label>Archivo subido correctamente</label>
                                <input type="submit" value="Volver">
                            </form>
                        </body>
                        </html>`
                    );
                fs.unlink(file.path, (err) => {
                    if (err) throw err;
                });
            }
        });
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
};

module.exports = { uploadFileGet, uploadFilePost };