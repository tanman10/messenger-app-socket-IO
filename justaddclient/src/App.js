import './App.css';
import { useState, useEffect, useRef } from 'react';
import io from "socket.io-client";
const socket = io('http://localhost:5000');

function App() {
  const [socketId, setSocketId]= useState("");
  const [message, setMessage] = useState("");
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [room, setRoom] = useState("");
  const [chat, setChat] = useState([]);
  const chatContainer = useRef(null);

  useEffect(()=>{
    socket.on('me', (id)=>{
      setSocketId(id);
    });
    socket.on('disconnect', ()=>{
      socket.disconnect()
    });
    socket.on('getAllUsers', (users)=>{
      setUsers(users)
    });
    // for in real time
    socket.on('updateUsers', (users)=>{
      setUsers(users);
    });
    socket.on('getAllRooms', (rooms)=>{
      setRooms(rooms)
    });
    // for in real time
    socket.on('updateRooms', (rooms)=>{
      setRooms(rooms)
    });
    socket.on('chat', (payload)=>{
      setChat(payload.chat);
    });
    // start window at the bottom of message (most recent)
    if(joinedRoom === true){
      chatContainer.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  },[chat, rooms, users])


  const sendMessage = async () =>{
    const payload = {message, room, socketId}
    socket.emit('message', payload)
    setMessage("");
    socket.on('chat', (pay)=>{
      setChat(pay.chat);
    });
    // start window at the bottom of message (most recent)
    chatContainer.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const createRoom = () =>{
    socket.emit('create_room')
    socket.on('add_room', (room) =>{
      setRooms([...rooms,room])
    });
  };

  const joinRoom = (room) => {
    socket.emit('join_room', room);
    setRoom(room.id);
    setJoinedRoom(true);
    setChat(room.chat);
  };


  return (
    <div>
      <h1>Chat App</h1>
      <h1>Me: {socketId}</h1>
      <h3>
        {joinedRoom === true ? `Room: ${room}`: "You are not joined in any room"}
      </h3>

      {/* when not in a room */}
      {!joinedRoom && (
        <>
          <h2> Online Users: </h2>
          <ul>
            {users.map((user) => {
              return (
                <li key = {users}>
                  {user && user === socketId ? "*Me" : user}
                </li>
              )
            })}
          </ul>
          <h2>Available Rooms:</h2>
          {rooms.length === 0 ? (
            <h3>No Rooms! Create a room !</h3>
          ) : (
            <ul>
              {rooms.map((room) => {
                return (
                  <li 
                    key={room.id} 
                    onClick={() => joinRoom(room)}
                  >
                    {room.id}
                  </li>
                );
              })}
            </ul>
          )}
          <button onClick={() => createRoom()}>
            Create Room
          </button> 
        </>
      )}

      {/* when in a room */}
      {joinedRoom && (
        <>
          <ul ref={chatContainer}>
            {chat.map((chat, idx) => (
              <li key={idx}>
                {chat.writer === socketId
                  ? `${chat.message}: ME*`
                  : `User (${chat.writer.slice(0, 5)}): ${chat.message}`}
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Your message ..."
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              value={message}
            />
            <button
              type="submit"
              onClick={() => sendMessage()}
            >
              Send
            </button>
          </form>
        </>
      )}

    </div>
  );
}

export default App;
