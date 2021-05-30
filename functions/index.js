const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const admin = require("firebase-admin");
admin.initializeApp();

const app = express();
const login = express();  
const getdoctor = express();  
const messagesend = express();
const messagesget = express();
const patientschats = express();

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
    let f = 0, uid="", name = "", userType = ""; 
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        if(data.email == credentials.email && data.password == credentials.password){
            f=1;
            uid = id;
            name = data.name;
            userType = data.type;
        }
    });
    if(f==1)
        res.status(200).send({resp: "200", uid: uid, name: name, type: userType});
    else    
        res.status(400).send({resp: "400"});
});

getdoctor.post('/', async (req, res) =>{
    const uid = req.body.uid;
    const patient = await admin.firestore().collection('users').doc(uid).get();
    if(patient.data().type != "patient" || patient.data().doctorAlloted == true){
        return res.status(200).send({resp: 'Doctor already allotted', 
                                            chatId: patient.data().chatId,
                                            type: patient.data().type});
    }
    const snapshot = admin.firestore().collection('users').get();
    let f = 0, docUid = ""; 
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        if(data.type == "doctor"){
            f=1;
            docUid = id;
        }
    });
    await admin.firestore().collection('users').doc(uid).update({doctorAlloted: true});
    const chatThread = {
        patient: uid,
        doctor: docUid,
    };
    const addId = await admin.firestore().collection('chats').add(chatThread);
    functions.logger.log("IDDD: " + addId.id);
    await admin.firestore().collection('chats').doc(addId.id).update({chatId: addId.id});
    await admin.firestore().collection('users').doc(uid).update({chatId: addId.id});
    // await admin.firestore().collection('users').doc(docUid).update({chatId: addId});
    await admin.firestore().collection('users').doc(docUid)
            .collection('chats').doc(addId.id).set({
                chatId: addId.id,
            });
    if(f==1)
        res.status(200).send({resp: "200", chatId: patient.data().chatId});
    else    
        res.status(400).send({resp: "400"});
});

messagesend.post('/', async (req, res) =>{
    const message = req.body;
    var timestamp = new Date().getTime();
    await admin.firestore().collection('chats').doc(message.chatId)
            .collection('messages').doc(message.timestamp+"").set({
        sender: message.uid,
        timestamp: message.timestamp,
        senderName: message.userName,
        content: message.text,
        type: message.type
    })
    await admin.firestore().collection('chats').doc(message.chatId)
                .update({lastMessage: message.text, timestamp: message.timestamp});
    const userData = await admin.firestore().collection('users').doc(message.uid).get();
    const chatData = await admin.firestore().collection('chats').doc(message.chatId).get();
    await admin.firestore().collection('users').doc(chatData.data().doctor)
            .collection('chats').doc(message.chatId).update({
                sender: message.uid,
                timestamp: message.timestamp,
                senderName: message.userName,
                content: message.text
            });
    res.status(200).send({resp: "Message sent"});
});

messagesget.post('/', async (req, res) =>{
    const chatId = req.body.chatId;
    const snapshot = admin.firestore().collection('chats').doc(chatId)
                    .collection('messages').get();
    let messages = [];
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        messages.push({id, ...data});
    });

    res.status(200).send(JSON.stringify(messages));
});

patientschats.post('/', async (req, res) =>{
    const docUid = req.body.uid;
    const snapshot = admin.firestore().collection('users').doc(docUid)
                    .collection('chats').get();
    let patients = [];
    (await snapshot).forEach(doc => {
        let id = doc.id;
        let data = doc.data();
        patients.push({...data});
    });

    res.status(200).send(JSON.stringify(patients));
    // let ids = [];
    // let patients = [];
    // const snapshot = admin.firestore().collection('users').doc(docUid)
    //             .collection('chats').get();
    // (await snapshot).forEach(doc => {
    //     let chat = doc.data().chatId;
    //     ids.push(chatId);
    //     async chatId => {
    //         const messageData = await admin.firestore()
    //                         .collection('chats').doc(chatId).get();
    //         const patientData = await admin.firestore().collection('users')
    //                     .doc(messageData.data().patient).get();
    //         patients.push({
    //             uid: messageData.data().patient,
    //             timestamp: messageData.data().timestamp,
    //             text: messageData.data().lastMessage,
    //             name: patientData.data().name
    //         });
    //         functions.logger.log("IDDD " + patients[patients.length-1]);
    //     }                 
    // });
    // // ids.forEach(async chatId => {
    // //     const messageData = await admin.firestore()
    // //                     .collection('chats').doc(chatId).get();
    // //     const patientData = await admin.firestore().collection('users')
    // //                 .doc(messageData.data().patient).get();
    // //     patients.push({
    // //         uid: messageData.data().patient,
    // //         timestamp: messageData.data().timestamp,
    // //         text: messageData.data().lastMessage,
    // //         name: patientData.data().name
    // //     });
    // //     functions.logger.log("IDDD " + patients[patients.length-1]);
    // // });
    // res.status(200).send(JSON.stringify(patients));
});



exports.user = functions.https.onRequest(app);
exports.userlogin = functions.https.onRequest(login);
exports.searchdoctor = functions.https.onRequest(getdoctor);
exports.getmessages = functions.https.onRequest(messagesget);
exports.sendmessage = functions.https.onRequest(messagesend);
exports.getpatientschats = functions.https.onRequest(patientschats);


function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}  

