
const app = require('express')()
const server = require('http').createServer(app)
const PORT = 5000
const io = require('socket.io')(server,{
    cors:{
        origin: "*",
    },
});

let users = [];
let rooms = [];

io.on('connection', (socket) => {
    /*
        socket.emit most efficient for updating your state
        socket.broadcast.emit most efficient for updating your state for others 
        io.socket.emit a little less efficient then socket.broadcast.emit
    */
    // update your state
    socket.emit('me', socket.id);   

    // add yourself to the online list
    users.push(socket.id); 

    // let them know you're now online
    socket.broadcast.emit('updateUsers', users) 
    
    // when you disconnect
    // in theory this works but in practice it empties the users list
    socket.on('disconnect', ()=> { 
        // tell everyone you are hoping offline
        users = users.filter((user) => {user !== socket.id})
        socket.broadcast.emit('updateUsers', users)
        socket.disconnect();
    });

    // see who's online
    socket.emit('getAllUsers', users);

    // create room option
    socket.on('create_room', ()=>{
        // default parameters
        const room = {
            id: Math.floor(Math.random() * (9999 - 1000)) + 1000,
            capacity:10,
            usersJoined: [socket.id],
            chat:[],
        };
        // don't actually know what this does
        // adds room to socket connection maybe?
        // but i don't see how thats any different from pushing it to the 
        // the list and then updating the state
        socket.join(room);
        socket.emit("add_room", room);
        rooms.push(room);
        // tell everyone you made a room
        socket.broadcast.emit("updateRooms", rooms);
    });
    
    // join room option
    socket.on("join_room", (room) => {
        socket.join(room.id);
    });

    // see all rooms available
    socket.emit("getAllRooms", rooms);

    // tell everyone to update their list again
    // socket.broadcast.emit("updateRooms", rooms);

    // messaging option
    socket.on("message", (payload) => {
        rooms.map((room) => {
            if (room.id === payload.room) {
                singleChat = { 
                    message: payload.message, 
                    writer: payload.socketId 
                };
                room.chat.push(singleChat);
                payload.chat = room.chat;
            }
        });
    io.to(payload.room).emit("chat", payload);
    });
});
    
// necessary to start listening
server.listen(PORT, () => {
    // console.log(`Server listening on port ${PORT}`);
});