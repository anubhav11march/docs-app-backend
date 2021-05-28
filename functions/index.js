const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();

const app = express();
const login = express();    

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
    const user = req.body;
    if(!validateEmail(user.email)){
        res.status(400).send("Invalid email" + user.email);
    }
    else if(user.name.length < 3){
        res.status(400).send("Invalid Name" + user.name);
    }
    else if(user.password.length < 6){
        res.status(400).send("Please a valid password of minimum 6 characters.")
    }
    else{
        await admin.firestore().collection('users').doc(req.params.id).update({
            ...body
        });

        res.status(200).send("User updated successfully");
    }
});

app.post('/', async (req, res) =>{
    const user = req.body;
    if(!validateEmail(user.email)){
        res.status(400).json({resp: "400"});
    }
    else if(user.name.length < 3){
        res.status(400).json({resp: "400"});
    }
    else if(user.password.length < 6){
        res.status(400).json({resp: "400"});
    }
    else{
        await admin.firestore().collection("users").add(user);

        res.status(200).json({resp: "200"});
        // res.status(201).send("User Created Successfully");
    }
});

login.post('/', async (req, res) =>{
    const credentials = req.body;
    const snapshot = admin.firestore().collection('users').get();
    let f = 0; 
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        if(data.email == credentials.email && data.password == credentials.password){
            f=1;
        }
    });
    if(f==1)
        res.status(200).json({resp: "200"});
    else    
        res.status(400).json({resp: "400"});
});

exports.user = functions.https.onRequest(app);
exports.userlogin = functions.https.onRequest(login);

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}  

