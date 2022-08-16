var admin = require("firebase-admin");

var serviceAccount = require("../dummy.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://projectakhir-f0566-default-rtdb.firebaseio.com"
});

module.exports = admin