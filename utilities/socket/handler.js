/* -----------------------------------------------------------------------
   * @ description : Main module containing all the Event management functonality
----------------------------------------------------------------------- */

const model = require("../../models/");
//import { uploadFile } from "../controllers/common";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_MESSAGE
} from "../../utilities/constants";
import Events from "../event";
import {loggedInUserToken, 
  findAllByCondition
} from "../../services/common_method";
const moment = require("moment")

export default {
  /************ Authenticate user on make socket connection ********/
  authenticate: async (request, callback) => {
    const { token, socketId } = request;
    const user = await loggedInUserToken(token);
    console.log('user >>>', user)
    if (user) {
      const rooms = await model.chat_user.findAll({
        where: { userId: user.id },
        raw : true 
      });
      console.log('rooms >>', rooms)
      // eslint-disable-next-line standard/no-callback-literal
      callback({ user, rooms });
    }
    callback(null);
  },
  /************ Save messages **********/
  sendMessage: async (request, callback) => {
    if(request.chatRoomId != null && request.userId != null){
      let message = await model.chat_message.create(request);
      if (message) {
        let result = await model.chat_room.findOne({
          attributes : ['id'],
          where : {
            id : request.chatRoomId
          },
          include: [
            {
              model: model.chat_user,
              attributes: ['chatRoomId', 'userId'],
              include : [
                {
                  model: model.user,
                  attributes: ['firstName', 'lastName', 'id'],
                }
              ],
            },
            {
              model: model.chat_message,
              include : [
                {
                  model: model.user,
                  attributes: ['firstName', 'lastName', 'id'],
                }
              ],
              limit: 1,
              order: [['createdAt', 'DESC']]    
            },
          ],    
        });
        const targetId = result.chat_users.filter(obj => {
          if (obj.userId != request.userId) {
            return obj;
          }
        });
        const notificationObj = Object.assign(
          {},
          {
            userId: request.userId,
            targetId: targetId[0].userId,
            notificationType: NOTIFICATION_CATEGORY.MESSAGE,
            message: `${result.chat_messages[0].user.firstName} has sent you a message.`,
            title: 'New message',
            isActionRequired: true,
            messageId: result.chat_messages[0].id
          }
        )
        Events.emit("notification", {
          data: notificationObj,
          id: targetId[0].userId
        });
        const resObj = Object.assign(
          {},
          {
            id : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].id : '',
            message: result.chat_messages && result.chat_messages.length > 0 ?result.chat_messages[0].message : '',
            createdAt: result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].createdAt : '',
            timeDiff: result.chat_messages && result.chat_messages.length > 0 ? moment(result.chat_messages[0].createdAt, 'YYYY.MM.DD').fromNow() : '',
            status : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].status : '',
            messageType : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].messageType : '',
            media : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].media : '',
            firstName : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].user.firstName : '',
            lastName : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].user.lastName : '',
            userId : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].user.id : '',
            chatRoomId : result.chat_messages && result.chat_messages.length > 0 ? result.chat_messages[0].chatRoomId : '',
            targetId : targetId[0].userId
          }
        )
        callback(resObj);
      } else {
        callback(null);
      }
    }
  },
  /************ Logout socket session on discoonect socket **********/
  disconnect: async (request, callback) => {
    const { userId } = request;
    const rooms = await model.chat_user.findAll({
        where: { userId: userId },
        raw : true 
    });
    callback(rooms);
  },

  createRoom: async (data, callback) => {
    let roomUserIds = [];
    roomUserIds[0] = data.to
    roomUserIds[1] = data.from
    let roomId;
    let result = await model.chat_user.findAll({
        attributes : ['chatRoomId', 'userId'], 
        where : {
          $or: [
          {
            userId: data.to,
          },
          {
            userId : data.from
          }
        ]
      }
    });
    // create userId's array having common roomId
    const newArray = result.reduce(function(acc, curr) {
      const findIfRoomIdExist = acc.findIndex(function(item) {
        return item.chatRoomId === curr.chatRoomId;
      })
      if (findIfRoomIdExist === -1) {
        let obj = {
        "chatRoomId": curr.chatRoomId,
        "userId": [curr.userId]
      }
      acc.push(obj)
      } else {
        acc[findIfRoomIdExist].userId.push(curr.userId)
      }
      return acc;
    }, []);
  
    const foundObj = newArray.find((obj ) => {
      return obj.userId.sort().toString() == roomUserIds.sort().toString();
    });
    if (!foundObj) { // if not found, create room
      if(data.to && data.from) { 
        const room = await model.chat_room.create({createdBy: data.to});
        //save chat user i.e to and from
        await model.chat_user.create( {userId : data.to, chatRoomId : room.dataValues.id});
        
        await model.chat_user.create({userId : data.from, chatRoomId : room.dataValues.id});
        roomId = room.dataValues.id
      }
    }
    const foundRoomId = foundObj ? foundObj.chatRoomId : roomId;
    let roomData = await model.chat_room.findOne({
      attributes : ['id'],
      where : {id : foundRoomId},
      include: [
        {
          model: model.chat_user,
          attributes: ['chatRoomId', 'userId'],
          where : {
            '$chat_users.userId$' : {$ne : data.from}
          },
        },
        {
          model: model.chat_message,
          limit: 1,
          order: [['createdAt', 'DESC']]    
        },
      ]      
    });
    const roomObject = Object.assign(
      {},
      {
      id: roomData ? roomData.id : '',
      lastMessage: roomData.chat_messages && roomData.chat_messages.length >0 ? roomData.chat_messages[0].message : '',
      lastMessageBy: roomData.chat_messages && roomData.chat_messages.length >0 ? roomData.chat_messages[0].userId : '',
      lastMessageDate: null,
      user: roomData.chat_users && roomData.chat_users.length >0 ? roomData.chat_users[0].userId : ''
    });
    callback(roomObject);
  }
};
