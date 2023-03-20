const {google} = require('googleapis');
const admin = require('firebase-admin');
const express = require('express');
const serviceAccount = require('./serviceAccountKey.json');
const axios = require('axios');
const xlsx = require('xlsx');
const bodyParser = require('body-parser');
const nodeMailer = require('nodemailer');
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const auth = new google.auth.GoogleAuth({
    keyFile: './serviceAccountKey.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({version: 'v4', auth});

const sheetId = process.env.SHEET_ID;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

//create post request to add new event to google sheets so create a new sheet, the parameter is the event name. Also set the header row in the new sheet. 
//Send a 200 response if successful, 500 if not.
app.post('/addEvent', (req, res) => {
    if (!req.body.eventName) return res.sendStatus(400);
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const eventSheet = {
        spreadsheetId: sheetId,
        resource: {
            requests: [{
                addSheet: {
                    properties: {
                        title: eventSheetName,
                    },
                },
            
            }],
        },
    };
    //create the sheet
    sheets.spreadsheets.batchUpdate(eventSheet, (err, res) => {
        if (err) return console.log('Error agregando evento: ' + err);
        //console.log(res);
        //set the header row
        sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: eventSheetName + '!A:GF',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['Nombre', 'Apellido', 'Email', 'Nivel', 'Status', 'Asesor', 'Observaciones']],
            },
        }, (err, res) => {
            if (err) return console.log('Error agregando encabezado: ' + err);
        });

        sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        }, (err, res) => {
            if (err) return console.log('Error obteniendo evento a agregar: ' + err);
            const id = res.data.sheets.find(s => s.properties.title === eventSheetName).properties.sheetId;

            
        });
    });
    res.sendStatus(200);
});

app.post('/updateUser', (req, res) => {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const body = req.body;
    //get values from the sheet
    sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: eventSheetName + '!A:G',
    }, (err, res) => {
        if (err) return console.log('Error obteniendo valores: ' + err);
        const values = res.data.values;
        if (values.length) {
            var index = values.findIndex(x => x[0] === body.name && x[1] === body.surname && x[2] === body.email) + 1;
            sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: eventSheetName + '!A' + index + ':G' + index,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[body.name, body.surname, body.email, body.lvl, body.status, body.encargado, body.observacion]],
                },
            }, (err, res) => {
                if (err) return console.log('Error actualizando usuario: ' + err);
            });
            
        }
        //get the sheet id
        sheets.spreadsheets.get({
            spreadsheetId: sheetId,
        }, (err, res) => {
            if (err) return console.log('Error obteniendo evento a agregar: ' + err);
            const id = res.data.sheets.find(s => s.properties.title === eventSheetName).properties.sheetId;

            sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                resource: {
                    requests: [{
                        setBasicFilter: {
                            filter: {
                                range: {
                                    sheetId: id,
                                    startRowIndex: 0,
                                    endRowIndex: 1000,
                                    startColumnIndex: 0,
                                    endColumnIndex: 7,
                                },
                                sortSpecs: [{
                                    dimensionIndex: 4,
                                    sortOrder: 'ASCENDING',
                                }],
                            },
                        },
                    }],
                },
            }, (err, res) => {
                if (err) return console.log('Error ordenando usuario: ' + err);
                //console.log(res);
            });

            const eventS = {
                spreadsheetId: sheetId,
                resource: {
                    requests: [{
                        addConditionalFormatRule: {
                            rule: {
                                ranges: [{
                                    sheetId: id,
                                    startRowIndex: 0,
                                    endRowIndex: 1000,
                                    startColumnIndex: 0,
                                    endColumnIndex: 7,
                                }],
                                booleanRule: {
                                    condition: {
                                        type: 'TEXT_EQ',
                                        values: [{
                                            userEnteredValue: 'true',
                                        }],
                                    },
                                    format: {
                                        backgroundColor: {
                                            red: 0.0,
                                            green: 1.0,
                                            blue: 0.0,
                                        },
                                    },
                                },
                            },
                            index: 0,
                        },
                    }],
                },
            };
            sheets.spreadsheets.batchUpdate(eventS, (err, res) => {
                if (err) return console.log('Error agregando formato condicional: ' + err);
                //console.log(res);
            });

            sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                resource: {
                    requests: [{
                        autoResizeDimensions: {
                            dimensions: {
                                sheetId: id,
                                dimension: 'COLUMNS',
                                startIndex: 0,
                                endIndex: 7,
                            },
                        },
                    }],
                },
            }, (err, res) => {
                if (err) return console.log('Error redimensionando usuario: ' + err);
                //console.log(res);
            });
        });
    });
    res.sendStatus(200);
});

//create post request to add new user to google sheets so add a new row to the sheet with the event name. The parameters are the event and a user object with the user data.
//Send a 200 response if successful, 500 if not
app.post('/addUserToEvent', (req, res) => {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const body = req.body;
    //get the sheet id
    sheets.spreadsheets.get({
        spreadsheetId: sheetId,
    }, (err, res) => {
        if (err) return console.log('Error obteniendo evento a agregar usuario: ' + err);
        sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: eventSheetName + '!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[body.name, body.surname, body.email, body.lvl, body.status, body.encargado, body.observacion]],
            },
        }, (err, res) => {
            if (err) return console.log('Error agregando usuario: ' + err);
            //console.log(res);
        });
    });

    sendEmail(eventSheetName, body.name, body.surname, body.email, body.lvl, body.id, body.date, body.location);

    res.sendStatus(200);
});

function sendEmail(event, name, surname, email, lvl, id, date, location) {
    const qrCodeEncoded = encodeURIComponent(id);
    const qrCode =`<p><img src=\"https://quickchart.io/qr?text=${qrCodeEncoded}&amp;size=300&amp;centerImageUrl=https://i.imgur.com/d4walK4.jpeg\" style=\"height:300px; max-width:100%; width:300px\" /></p>`
    
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

    const mailOptions = {
        from: 'Inversiones Millonarias <registrapp2023@gmail.com>',
        to: email,
        subject: 'Entrada evento - ' + event,
        html : 
        `<h1>¡Hola ${name} ${surname}!</h1>
        <p>Felicitaciones por haber tomado acción y confirmar tu asistencia al evento de Inversiones Millonarias el día ${date} en ${location} en la ciudad de ${event}.</p>
        <p>Este es tu código QR para acceder al evento:</p>
        ${qrCode}
        <p>Recuerda tenerlo en tu teléfono al ingresar.</p>
        <p>Para más información puedes contactar a tu asesor.</p>
        <p>¡Nos vemos pronto!</p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
        }
    });
}


//create post request to delete a sheet with the event name. The parameter is the event name.
//Send a 200 response if successful, 500 if not.
app.post('/deleteEvent', (req, res) => {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    //get the sheet id
    sheets.spreadsheets.get({
        spreadsheetId: sheetId,
    }, (err, res) => {
        if (err) return console.log('Error obteniendo evento a eliminar: ' + err);
        const id = res.data.sheets.find(s => s.properties.title === eventSheetName).properties.sheetId;
        
        sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
                requests: [{
                    deleteSheet: {
                        sheetId: id,
                    },
                }],
            },
        }, (err, res) => {
            if (err) return console.log('Error eliminando evento: ' + err);
        });
    });

    res.sendStatus(200);
});


app.post('/deleteUser', (req, res) => {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    //get user row
    sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: eventSheetName + '!A:G',
    }, (err, res) => {
        if (err) return console.log('Error obteniendo usuario: ' + err);
        const body = req.body;
        const values = res.data.values;
        if (values.length) {
            var index = values.findIndex(x => x[0] === body.name && x[1] === body.surname && x[2] === body.email);
            //delete user row
            sheets.spreadsheets.values.batchClear({
                spreadsheetId: sheetId,
                ranges: [eventSheetName + '!A' + (index + 1) + ':G' + (index + 1)],
            }, (err, res) => {
                if (err) return console.log('Error eliminando usuario: ' + err);
                //console.log(res);
            });
        }
    });
    res.sendStatus(200);
});

//check if id in event exists in db
app.post('/checkUser', (req, res) => {
    const eventName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const id = req.body.id;
    db.collection("events").doc(eventName).collection("users").doc(id).get().then((doc) => {
        if (doc.exists) {
            res.send(true);
        } else {
            res.send(false);
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
});


app.get('/addExcelToEvent', (req, res) => {
    db.collection("events").get().then((querySnapshot) => {
      let events = [];
      querySnapshot.forEach((doc) => {
        events.push(doc.id);
      });
  
      let options = "";
      for (let i = 0; i < events.length; i++) {
        options += `<option value="${events[i]}">${events[i]}</option>`;
      }
  
      res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Upload Excel File</title>
      </head>
      <body>
        <form action="/addExcelToEvent" method="post" enctype="multipart/form-data">
          <label for="event-select">Select an event:</label>
            <select name="event">
                ${events.map((event) => `<option value="${event}">${event}</option>`)}
            </select>
            <input type="file" name="excel_file" accept=".xlsx">
            <br>
            <br>
          <input type="submit" value="Upload Excel File">
        </form>
      </body>
      </html>      
      `);
    });
  });
  

app.post('/addExcelToEvent', (req, res) => {
    const event = req.body.event;
    console.log(req.body);
    const eventSheetName = event.replace(/\s+/g, ''); // Remove whitespace from the event name
    const excelFile = req.files.excel_file;

    /*const workbook = xlsx.read(file.data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);   

    //check if the format is correct
    if (data[0].Nombre === undefined || data[0].Apellido === undefined || data[0].Email === undefined || data[0].Nivel === undefined || data[0].Estado === undefined || data[0].Encargado === undefined) {
        res.send("Formato incorrecto");
        return;
    }
    

    data.forEach((row) => {
        //check if row is empty
        if (row.Nombre === undefined || row.Apellido === undefined || row.Email === undefined || row.Nivel === undefined || row.Estado === undefined || row.Encargado === undefined) {
            return;
        }

        //create user class
        const user = new User(row.Nombre, row.Apellido, row.Email, row.Nivel, row.Estado, row.Encargado);
        //add user to db
        db.collection("events").doc(event).collection("users").doc(user.email).set({
            name: user.name,
            surname: user.surname,
            email: user.email,
            lvl: user.lvl,
            status: user.status,
            encargado: user.encargado,
        }).then(() => {
            console.log("Document successfully written!");
        }).catch((error) => {
            console.error("Error writing document: ", error);
        });

        axios.post('https://registra-app.uc.r.appspot.com/addUserToEvent', {
            eventName: event,
            name: user.name,
            surname: user.surname,
            email: user.email,
            lvl: user.lvl,
            status: user.status,
            encargado: user.encargado,
        }).then((response) => {
            console.log(response);
        }).catch((error) => {
            console.log(error);
        });
    });*/

    res.send("Excel file uploaded successfully to event: " + event);
});

app.get('/', (req, res) => {
    res.send('Server awake!' + new Date().toLocaleString());
});

class User {
    constructor(name, surname, email, lvl, status, encargado) {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.lvl = lvl;
        this.status = status;
        this.encargado = encargado;
    }
}

