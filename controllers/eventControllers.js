const { db, sheets, sheetId } = require('../config/googleConfig');


function deleteEvent(req, res) {
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    //recursive delete all users from the path event/users
    db.collection('events').doc(eventSheetName).collection('users').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            db.collection('events').doc(eventSheetName).collection('users').doc(doc.id).delete().then(() => {
                console.log('Usuario eliminado de la base de datos con ID: ' + doc.id);
            }).catch(err => {
                console.log('Error eliminando usuario de la base de datos: ' + err);
            });
        });
    }).catch(err => {
        console.log('Error obteniendo usuarios de la base de datos: ' + err);
    });
    //delete the event from the path event
    db.collection('events').doc(eventSheetName).delete().then(() => {
        console.log('Evento eliminado de la base de datos con ID: ' + eventSheetName);
    }).catch(err => {
        console.log('Error eliminando evento de la base de datos: ' + err);
    });

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
};

function addEvent(req, res) {
    if (!req.body.eventName) return res.sendStatus(400);
    const eventSheetName = req.body.eventName.replace(/\s+/g, ''); // Remove whitespace from the event name
    const eventDate = req.body.date;
    const eventLocation = req.body.location;

    db.collection('events').doc(eventSheetName).set({
        name: req.body.eventName,
        date: eventDate,
        location: eventLocation,
    });

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
            range: eventSheetName + '!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['Nombre', 'Apellido', 'Nivel', 'Telefono', 'Status', 'Asesor', 'Observaciones']],
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
};

module.exports = { deleteEvent, addEvent };