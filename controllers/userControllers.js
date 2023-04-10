const {db, sheets, sheetId} = require('../config/googleConfig');
const {sendEmail} = require('../scripts/send.js');

function updateUser(req, res)  {
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
            var index = values.findIndex(x => x[0] === body.name && x[1] === body.surname && x[2] === body.lvl && x[3] === body.phone) + 1;
            sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: eventSheetName + '!A' + index + ':G' + index,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[body.name, body.surname, body.lvl, body.phone, body.status, body.encargado, body.observacion]],
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
                                    endColumnIndex: 8,
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
                                    endColumnIndex: 8,
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
                                endIndex: 8,
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
};

function addUserToEvent(req, res)  {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const body = req.body;
    const phone = body.phone.replace('+', '');
    var userId = '';
    var date = '';
    var location = '';
    db.collection('events').doc(eventSheetName).get().then((doc) => {
        if (doc.exists) {
            date = doc.data().date;
            location = doc.data().location;
        }
    });
    db.collection('events').doc(eventSheetName).collection('users').add({
        name: body.name,
        surname: body.surname,
        lvl: body.lvl,
        encargado: body.encargado,
        observacion: body.observacion,
        active: true,
        phone: phone,
    }).then((docRef) => {
        userId = docRef.id;
        //get 'body' field from mailBody in the database
        db.collection('mailBody').doc('body').get().then((doc) => {
            if (doc.exists) {
                const mailBody = doc.data().body;
                const image = doc.data().image;
                sendEmail(eventSheetName, body.name, body.surname, userId, date, location, body.encargado, mailBody, body.lvl);
            } else {
                console.log('No such document!');
            }
        }).catch((error) => {
            console.log('Error getting document:', error);
        });
        console.log('Usuario agregado a la base de datos con ID: ' + userId);
    }).catch(err => {
        console.log('Error agregando usuario a la base de datos: ' + err);
    });

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
                values: [[body.name, body.surname, body.lvl, body.phone, '', body.encargado, body.observacion]],
            },
        }, (err, res) => {
            if (err) return console.log('Error agregando usuario: ' + err);
            //console.log(res);
        });
    });
    res.sendStatus(200);
};

function getMenu(req, res) {
    //make buttons to redirect to: /image, /changeMailBody, /getKeys, /deleteImage, /uploadFile
    res.send(
        `<!DOCTYPE html>
        <html>
        <head>
            <title>Menu</title>
            <style>
            body {
                background-color: #212121;
                color: #fff;
                font-family: Arial, sans-serif;
            }
            
            h1 {
                text-align: center;
                margin-top: 50px;
                font-size: 48px;
                text-shadow: 2px 2px #333;
            }
            
            ul {
                list-style: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-top: 50px;
            }
            
            li {
                margin-bottom: 20px;
                box-shadow: 2px 2px #333;
                border-radius: 10px;
                overflow: hidden;
            }
            
            button {
                background-color: #f44336;
                color: #fff;
                padding: 10px;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease-in-out;
            }
            
            button:hover {
                background-color: #4CAF50;
            }
            
            a {
                text-decoration: none;
            }
            
            a:hover {
                text-decoration: underline;
            }
            </style>
        </head>
        <body>
            <h1>Menu</h1>
            <ul>
                <li><a href="/image"><button>Image</button></a></li>
                <li><a href="/changeMailBody"><button>Change Mail Body</button></a></li>
                <li><a href="/getKeys"><button>Get Keys</button></a></li>
                <li><a href="/deleteImage"><button>Delete Image</button></a></li>
                <li><a href="/uploadFile"><button>Upload File</button></a></li>
            </ul>
        </body>
        </html>
        `
    )
}

module.exports = { updateUser, addUserToEvent, getMenu };