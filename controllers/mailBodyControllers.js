const {db, storage} = require('../config/googleConfig');

function changeMailBody (req, res) {
    let images = [];
    //get all the images public url from storage
    const bucketName = 'registra-app.appspot.com';
    storage.bucket(bucketName).getFiles().then(results => {
    const files = results[0];
    files.forEach(file => {
        //if prefix is background/ ignore it
        if (!file.name.includes('background/')) {
            images.push(file.publicUrl());
        }
    });
    res.send(
        `<html>
            <script>
                function getSelectedImage(image) {
                    document.getElementById('selected-image').src = image;
                }
                window.onload = function() {
                    getSelectedImage(document.getElementById('image').value);
                }
            </script>
            <head>
                <title>Change mail body</title>
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
                    select {
                        font-size: 16px;
                        padding: 5px;
                        border-radius: 5px;
                        border: 1px solid #ccc;
                        width: 100%;
                        margin-bottom: 10px;
                    }
                    img {
                        display: block;
                        margin-top: 10px;
                        max-width: 200px;
                        max-height: 200px;
                    }
                </style>
            
            </head>
            </body>
            <form action="/changeMailBody" method="post">
                <label for="email">New mail body:</label>
                <input type="text" id="email" name="email"><br><br>
                <label for="image">Imagen:</label>
                <select id="image" name="image" onChange="getSelectedImage(this.value)">
                    ${images.map(image => `<option value="${image}">${image}</option>`)}
                </select>
                <label for="selected-image">Selected Image:</label>
                <img id="selected-image" src="" width="200" height="200">
                <br><br>
                <input type="submit" value="Submit">
            </form>
            </body>
            </html>`
    );
    }).catch(err => {
        console.error('ERROR:', err);
    });
};

function saveMailBody (req, res) {
    const mailBody = req.body.email;
    const imagen = req.body.image;
    console.log(mailBody);
    console.log(imagen);
    db.collection('mailBody').doc('body').set({
        body: mailBody,
        image: imagen,
    }).then(() => {
        console.log('Mail body saved');
        res.send(
            `<html>
                <head>
                    <title>Mail body saved</title>
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
                        p {
                            font-size: 18px;
                            color: #000;
                        }
                        h1 {
                            font-size: 24px;
                            color: #000;
                        }

                    </style>
                </head>
                <body>
                    <form action="/" method="get">
                        <p>Email cambiado correctamente</p>
                        <p>El nuevo email es: <p>
                        <h1>¡Hola Nombre Apellido!</h1>
                        <p>${mailBody} Fecha en Ubicación en el evento NombreEvento</p>
                        <p>Este es tu código QR para acceder al evento:</p>
                        <p><img src="https://quickchart.io/qr?text=ID&amp;size=300&amp;centerImageUrl=${imagen}\" style=\"height:300px; max-width:100%; width:300px\" /></p>
                        <p>Recuerda tenerlo en tu teléfono al ingresar.</p>
                        <p>Para más información puedes contactar a tu asesor.</p>
                        <p>¡Nos vemos pronto!</p>
                        <input type="submit" value="Submit">
                    </form>
                </body>
            </html>`
        );
    }).catch((error) => {
        console.error('Error saving mail body: ', error);
    });
};

module.exports = { changeMailBody, saveMailBody };