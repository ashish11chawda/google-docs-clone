const mongoose = require('mongoose');
const Document = require('./Document');

const defaultValue = "";

mongoose.connect("mongodb://127.0.0.1:27017/google-docs-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const io = require('socket.io')(3001, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        console.log("documentId: ", documentId);
        const document = await findOrCreateDocument(documentId);
        console.log("fetched document id: ", document._id);
        console.log("fetched document data: ", document.data);
        socket.join(documentId);
        socket.emit('load-document', document.data);
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        })
        socket.on('save-document', async data => {
            console.log("save-document data: ", data);
            const updatedDocument = await Document.findByIdAndUpdate(documentId, { data });
            const fetchedDocument = await Document.findById(documentId);
            console.log("saved document: ", fetchedDocument.data);
          });
    })
    console.log("connected")
})

async function findOrCreateDocument(id) {
    console.log("-- findOrCreateDocument --")
    if (id == null) {
        return;
    }

    const document = await Document.findById(id);
    if(document) {
        console.log("searched document id: ", document._id);
        console.log("searched document data: ", document.data);
        return document;
    } 
    return await Document.create({_id: id, data: defaultValue});
}