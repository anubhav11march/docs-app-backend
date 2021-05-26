const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();

const app = express();

app.get('/', async (req, res) =>{
    const snapshot = admin.firestore().collection('users').get();
    let users = [];
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();

        users.push({id, ...data});
    });

    res.status(200).send(JSON.stringify(users));
});

app.get('/:id', async (req, res) => {
    const snapshot = await admin.firestore().collection('users').doc(req.params.id).get();

    const userId = snapshot.id;
    const userData = snapshot.data();

    res.status(200).send(JSON.stringify({id: userId, ...userData}));
}); 

app.put("/:id", async (req, res) =>{
    const body = req.body;

    await admin.firestore().collection('users').doc(req.params.id).update({
        ...body
    });

    res.status(200).send("");
});

//try to verify if the req body is in the form required or not
app.post('/', async (req, res) =>{
    const user = req.body;
    await admin.firestore().collection("users").add(user);

    res.status(201).send("User Created Successfully");
});

app.get('/login/', async (req, res) =>{
    const snapshot = admin.firestore().collection('users').get();
    let f = 0; 
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        if(data.email == req.params.email){
            f=1;
        }
    });
    if(f==1)
        res.status(200).send(1);
    else    
        res.status(200).send("Invalid Email or Password");
});

exports.user = functions.https.onRequest(app);

