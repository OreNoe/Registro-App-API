const {google} = require('googleapis');
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
require('dotenv').config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const auth = new google.auth.GoogleAuth({
    keyFile: './serviceAccountKey.json',
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({version: 'v4', auth});

//export db and storage
const db = admin.firestore();
const storage = admin.storage();

const sheetId = process.env.SHEET_ID;

module.exports = { sheets, sheetId, db, storage };