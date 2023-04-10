const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storeMulter = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({storage: storeMulter});

const uploadController = require('./controllers/uploadControllers');
const mailBodyControllers = require('./controllers/mailBodyControllers');
const keysController = require('./controllers/keysControllers');
const imageControllers = require('./controllers/imageControllers');
const eventControllers = require('./controllers/eventControllers');
const userControllers = require('./controllers/userControllers');
const { db } = require('./config/googleConfig');

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
app.get('/', userControllers.getMenu);
app.get('/getKeys', keysController.getKeys);
app.get('/changeMailBody', mailBodyControllers.changeMailBody);
app.post('/changeMailBody', mailBodyControllers.saveMailBody);
app.get('/uploadFile', uploadController.uploadFileGet);
app.post('/uploadFile', upload.single('file'), uploadController.uploadFilePost);
app.get('/image', imageControllers.getImage);
app.post('/image', upload.single('image'), imageControllers.postImage);
app.get('/deleteImage', imageControllers.getDeleteImage);
app.post('/deleteImage', imageControllers.deleteImage);
app.post('/deleteEvent', eventControllers.deleteEvent);
app.post('/addEvent', eventControllers.addEvent);
app.post('/addUserToEvent', userControllers.addUserToEvent);
app.post('/updateUser', userControllers.updateUser);

//make a get request to /qr/${id} to get the qr code for the event with id ${id}
app.all('/qr/:event/:id', (req, res) => {
    var id = req.params.id;
    var event = req.params.event;
    event = event.charAt(0).toUpperCase() + event.slice(1);
    db.collection('events').doc(event).get().then((doc) => {
        const date = doc.data().date;
        const location = doc.data().location;
        db.collection('events').doc(event).collection('users').doc(id).get().then((doc) => {
            id = encodeURIComponent(id);
            const name = doc.data().name;
            const surname = doc.data().surname;
            const phone = doc.data().phone;
            var level = doc.data().lvl;
            console.log(name, surname, date, location, phone);

            db.collection('mailBody').doc('body').get().then((doc) => {
                var mailBody = doc.data().body;
                const qrCode = "https://registra-app.uc.r.appspot.com/qr/photo/" + event + "/" + level + "/"+ id;
                var mensajeMail = "¡Hola " + name + " " + surname + "!\n"+
                mailBody + date + " en " + location + " en la ciudad de " + event + ".\n"+
                "Este es tu código QR para acceder al evento\n"+
                "Recuerda tenerlo en tu teléfono al ingresar.\n"+
                "Para más información puedes contactar a tu asesor.\n"+
                "¡Nos vemos pronto!\n"+
                qrCode;
                mensajeMail = encodeURIComponent(mensajeMail);

                res.redirect('https://wa.me/' + phone + '?text=' + mensajeMail);
            });        
        });
    });
});

app.get('/qr/photo/:event/:level/:id', (req, res) => {
    var id = req.params.id;
    var event = req.params.event;
    var level = req.params.level;
    var background = "";
    event = event.charAt(0).toUpperCase() + event.slice(1);
    db.collection('mailBody').doc('body').get().then((doc) => {
        const image = doc.data().image;
        const qrCode = "https://quickchart.io/qr?text=" + id + "&size=300&centerImageUrl=" + image;
        switch(level) {
            case 'General':
                background = doc.data().lvl.general;
                break;
            case 'VIP':
                background = doc.data().lvl.vip;
                break;
            case 'Invitado':
                background = doc.data().lvl.invitado;
                break;
                default:
                background = doc.data().lvl.general;
        }
                
        res.send(
            `<!DOCTYPE html>
            <html>
            <head>
                <title>QR Code</title>
                <style>
                    html {
                        background-color: black;
                    }
                    #background-image {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        max-width: 600px;
                        max-height: 600px;
                    }
                    
                    #upper-image {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        max-width: 240px;
                        max-height: 240px;
                    }
                </style>
            </head>
            <body>
                <img src="${background}" alt="Background Image" id="background-image">
                <img src="${qrCode}" alt="QR Code Image" id="upper-image">
            </body>
            </html>
            `
        );
    });
});