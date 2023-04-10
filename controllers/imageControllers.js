const fs = require('fs');
const { pipeline } = require('stream');
const {storage} = require('../config/googleConfig');

function getImage (req, res) {
    res.send(
        `<html>
        <head>
            <title>Upload image</title>
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
        <form action="/image" method="post" enctype="multipart/form-data">
            <label for="image">Imagen:</label>
            <input type="file" name="image" id="image">
            <input type="submit" value="Submit">
        </form>
        <body>
        </html>`
    );
};

function postImage(req, res){
    const file = req.file;
    console.log(file);
    const bucketName = 'registra-app.appspot.com';
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(file.originalname);
    const fileReadStream = fs.createReadStream(file.path);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });
    blobStream.on('error', (err) => {
        console.log(err);
    });
    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        console.log(publicUrl);
        res.send(
            `<html>
            <head>
                <title>Image uploaded</title>
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
                    img {
                        display: block;
                        margin-top: 10px;
                        max-width: 200px;
                        max-height: 200px;
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
                <label for="image">Imagen:</label>
                <img src="${publicUrl}" alt="image">
                <input type="submit" value="Volver">
            </form>
            <body>
            </html>`
        );
    });
    pipeline(fileReadStream, blobStream, (err) => {
        if (err) {
            console.log(err);
        }
    });
};

function getDeleteImage(req, res){
    //get images from storage
    let imagesName = [];
    let imagesUrl = [];
    const bucketName = 'registra-app.appspot.com';
    storage.bucket(bucketName).getFiles().then((data) => {
        const files = data[0];
        files.forEach(file => {
            if (!file.name.includes('background/')){
                imagesName.push(file.name);
                imagesUrl.push(file.publicUrl());
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
                <title>Delete image</title>
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
            </body>
            <form action="/deleteImage" method="post">
                <label for="image">Imagen:</label>
                <select id="image" name="image" onChange="getSelectedImage(this.value)">
                    ${imagesName.map(image => `<option value="${imagesUrl[imagesName.indexOf(image)]}">${image}</option>`)}
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


function deleteImage(req, res){
    var image = req.body.image;
    image = image.substring(image.lastIndexOf('/') + 1);
    const bucketName = 'registra-app.appspot.com';
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(image);
    blob.delete().then(() => {
        res.send(
            `<html>
            <head>
                <title>Delete image</title>
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
            <head>
            <body>
                <form action="/" method="get">
                    <label>Imagen eliminada</label>
                    <input type="submit" value="Volver">
                </form>
            </body>
            </html>
            `
        );
    }).catch(err => {
        console.error('ERROR:', err);
    });
};

module.exports = { getImage, postImage, getDeleteImage, deleteImage };