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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: connectMongo.create({
            mongoUrl: process.env.MONGODB_URI
        })
    })
);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connection successful"))
    .catch(err => console.error("MongoDB connection failed:", err));

app.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/main');
    }
    res.redirect('/login');
});

app.use('/', require('./routes/auth'));
app.use('/main', require('./routes/main'));
app.use('/chat', require('./routes/chat'));
app.use('/friends', require('./routes/friends'));

const Message = require('./models/Message');

io.on('connection', socket => {
    console.log("User connected to chat");

    socket.on('joinRoom', ({ currentUserId, otherUserId }) => {
        const roomId = [currentUserId, otherUserId].sort().join('_');
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on('sendMessage', async ({ sender, receiver, content }) => {
        if (!content || !content.trim()) return;

        try {
            const message = new Message({
                sender,
                receiver,
                content
            });
            await message.save();

            const roomId = [sender, receiver].sort().join('_');
            io.to(roomId).emit('receiveMessage', {
                sender,
                receiver,
                content,
                timestamp: message.timestamp
            });

            console.log(`Message sent in room ${roomId}`);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log("User disconnected from chat");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
