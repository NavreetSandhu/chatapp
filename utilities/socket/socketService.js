import socketHandler from "./handler";
import * as TYPE from "./constants";
const socketIO = require("socket.io");
import Events from "../event";
export default server => {
  let io = socketIO(server);
  let users = {};
  io.on("connection", socket => {
    // Authenticate User
    socket.on("authenticate", (query, cb) => {
      const socketId = socket.id;
      let request = {
        token: query.token,
        socketId
      };
      socketHandler.authenticate(request, res => {
        if (res) {
          let userId = res.user.id;
          // Socket local object instance contains user ids corresponding to socket ids
          socket[socketId] = { userId };
          // User local object instance contains socket ids corresponding to user ids and sorties
          users[userId] = { socketId };
          // Join rooms for chat
          res.rooms.map(room => {
            socket.join(room.chatRoomId);
            return room;
          });
          console.log("conected");
          cb(true);
        } else {
          console.log("not conected");
          cb(false);
        }
       });
    });

    // Create Room
    socket.on("createRoom", (data, cb) => {
      console.log("create Room ", data);
      if(data.to != null && data.from != null){
        socketHandler.createRoom(data, res => {
          //console.log('sadasd >>>', res)
          if (res && socket && !socket.rooms[res.id]) {
            socket.join(res.id);
          }
          io.to(res.id).emit("create_room", res);
          if(cb){
            cb(res);
          }
        });
      }
      else{
        console.log("Enter receiver and sender ID.");
      }
    });

    // Disconnect Socket
    socket.on("disconnect", data => {
      const userId =
        socket && socket[socket.id] ? socket[socket.id].userId : "";
      if (userId) {
        socketHandler.disconnect({ userId }, res => {
          res.map(room => {
            socket.leave(room.chatRoomId);
          });
        });
      }
    });

    socket.on("message", (data, cb) => {
      socketHandler.sendMessage({ ...data }, res => {
        console.log('res >>', res)
        //io.to(res.chatRoomId).emit("new_message", res);
        //io.emit("new_message", res)

        io.emit("new"+res.targetId, (res)); 
        if(cb){
          cb(res);
        }
      });
    });
  });

   Events.on("notification", data => {
      if (io && data.userData && data.userData.id) {
        io.emit("new_notification"+data.userData.id, (data)); 
      }
    });
  
};
