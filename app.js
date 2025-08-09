const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.json());
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({mongoUrl: process.env.MONGODB_URI})
}));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connection successful brotha"))
    .catch(err => console.error("Oi sorry brotha but we couldn't managed to connect", err));

app.use('/', require('./routes/auth'));
app.use('/chat', require('./routes/chat'));

io.on('connection', (socket)=>{
    console.log("User connected to chat");
    socket.on('send message', (data) => {
        io.emit('received message', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Haha brotha server is running at http://localhost:${PORT}");
});



