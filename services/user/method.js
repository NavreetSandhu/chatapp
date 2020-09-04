/* Generate jwt Token */
// change password function get otp

/* Generate jwt Token */
import { getTimeStamp, generateToken } from "./../../utilities/universal";
import fs from 'fs';
const db = require("../../models/");
import { STATIC_PATH, LIMIT, NOTIFICATION_TEXT } from "./../../utilities/constants";
const {Sequelize, Op } = require('sequelize');
import * as Mail from "../../utilities/mail";
import * as CommonMethod from "./../common_method";
import Events from "../../utilities/event";
const moment = require("moment")
export const generateJwtToken = async (user) => {
  return new Promise((resolve, reject) => {
    let token = generateToken({
      when: getTimeStamp(),
      role: user.role,
      id: user.id,
      email: user.email,
      status : user.status
    });
    resolve(token);
  });
};
export const checkEmail = async (condition, model) => {
  return model.findOne({
    where: condition,
    attributes: ["id", "email", "is_active", "firstName"],
  });
};


export const findOneByConditionWithAtrributes = async (
  condition,
  attributes,
  model
) => {
  return model.findOne({
    where: condition,
    attributes: attributes,
  });
};
export const uploadBase64Image = async(base64Image) =>{
  //console.log('base64Image >>>', base64Image)
  base64Image = base64Image.split(';base64,').pop();
  let profileImgDir = STATIC_PATH.PROFILE_IMAGE;
  let profileImage;
  //console.log('profileImgDir >>', profileImgDir)
    return new Promise((resolve, reject)=>{
       if (!fs.existsSync(profileImgDir)){
           fs.mkdirSync(profileImgDir, {recursive: true}, err => {
             if(!err) {
               console.log('not error');
             }else {
               reject(err);
             }
         });
      }
      if(base64Image) {
        profileImage = Date.now() + '-' + 'image.png';
        //console.log('profileImage >>>', profileImage)
        let pathFile = profileImgDir + profileImage;
        //console.log('pathFile >>', pathFile)
        fs.writeFile(pathFile, base64Image, {encoding: 'base64'}, function(err) {
          console.log('profileImage >>', profileImage)
        });
      }
      resolve(profileImage);
    });
  }

  export const updateOneByCondition = async (recordupdate, condition, model) => {
    return model.update(recordupdate, {
      returning: true,
      where: condition,
  });


};

export const findOneByCondition = async (condition, model) => {
  return model.findOne({
    where: condition,
    attributes: [
      "id",
      "email",
      "firstName",
      "lastName",
      "role",
      "is_active",
      "last_login",
      "status"
    ],
  });
};


export const updateOrInsert = async (values, condition, model) => {
  const result =  await model.findOne({ where: condition })
  //console.log('resul >>', result)
  let status;
  if(result){ //update
    //console.log('values >>', values)
    status =  await result.update(values);
  }else {  // insert
    status = await model.create(values);
  }
  return status;
}

export const manageUserSkill = async (payload, model) => {
  if(payload.skills && payload.skills.length > 0) { //delete and save key skills
      let result = await model.destroy({ where: { userId: payload.userId } });
      const userSkills = payload.skills.map(function(item){
        return {
          userId  : payload.userId,
          skillId : item
        } 
      })
      return await model.bulkCreate(userSkills, {returning: true});
  }
}

export const searchAllUser = async (payload) => {
  //console.log('payload >>', payload, typeof payload.price, payload.price.length)
  let userSkills = [];
  let userWhere = {}
  let genderOption = ['Male', 'male', 'female', 'Female'];
  const skip =
    payload && payload["pageNumber"]
      ? (payload["pageNumber"] - 1) * LIMIT.RECORD_PER_PAGE
      : 0;
    if(payload.skills && payload.skills.length > 0) { 
       userSkills = payload.skills.map(function(item){
        return item.id 
      })
  }
  const skillWhere = userSkills.length > 0 ? { '$user_skills.skillId$': userSkills} : {};
  const activityWhere = payload.activityStatus ? { '$user_detail.activityStatus$': payload.activityStatus} : {};
  const detailWhere = payload.price && payload.price.length > 0 && payload.price[1] ? {
    $or: [
          {
            '$user_detail.priceMin$': {
              [Op.gte]: payload.price[0] 
            },
            '$user_detail.priceMax$': {
              [Op.lte]: payload.price[1]
            },
          },
          {
            '$user_detail.priceMin$': {
              [Op.lte]: payload.price[0]
            },
            '$user_detail.priceMax$': {
              [Op.gte]: payload.price[1]
            },
          },
          {
            '$user_detail.priceMin$': {
              [Op.between]: [payload.price[0], payload.price[1]]
            },
          },
          {
            '$user_detail.priceMax$': {
              [Op.between]: [payload.price[0], payload.price[1]]
            },
          },
        ]
  }: {}

  const nameWhere = payload && payload.name ? {
    $or: {
        firstName: {
          [Sequelize.Op.iLike]:  '%' + payload.name + '%' 
        },
        lastName : {
          [Sequelize.Op.iLike]:  '%' + payload.name + '%' 
        }
    }
  } : {}; 
  userWhere = payload ? {
    $and : [
      nameWhere,
      skillWhere,
      activityWhere,
      detailWhere
    ]
  } : {}
  if(payload.gender && genderOption.indexOf(payload.gender) > -1) {
    userWhere.gender = Sequelize.where(
      Sequelize.fn('lower', Sequelize.col('gender')), 
      Sequelize.fn('lower', payload.gender)
    )
  }
  
  const allUser =  await db.user.findAll({ 
    where : userWhere,
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "role",
      "profileImage",
      "title",
      "gender",
      "aboutMe",
      "status",
      [Sequelize.literal('(SELECT COUNT(*) FROM "user_recomendations" WHERE "user_recomendations"."userId" = "user"."id")'), 'reccount']
    ],
    include: [
      {
        model: db.user_detail,
        required: false,
        attributes: [],
      },
      {
        model: db.user_skill,
        attributes: [],
      },
      {
        model: db.user_recomendation,
        required: false,
        where : {},
        attributes: []
      },  
    ],
    group: ["user.id"],
    raw: true,
    offset: skip,
    limit: LIMIT.RECORD_PER_PAGE,
    order: [[Sequelize.literal("reccount"), 'DESC']],
    subQuery : false
  });
  
  // findAll with raw and group return multiple count thus repeating query to count 
  const userDetailAndCount =  await db.user.findAndCountAll({ 
    where : userWhere,
    attributes : ['id'],
    include: [
      {
        model: db.user_detail,
        attributes: [],
      },
      {
        model: db.user_skill, 
        attributes: []      
      }, 
     ],
     distinct : true    
  });
  const userIds = allUser.map(user => {
    return user.id;
  })
  //console.log('userIds >>>', userIds)
  const userDetailArray =  await db.user.findAll({ 
    where : {id : userIds},
    attributes : ['id'],
    include: [
      {
        model: db.user_detail,
         attributes: [
          "currency",
          "priceMax",
          "priceMin",
          "address",
          "activityStatus",
        ],
      },
      {
        model: db.user_skill,
        attributes: [
           "skillId",
           "id"
        ],
        include: [
            {
              model: db.skill,
              attributes: [
                "skill"
              ],
            }
          ],   
        },  
     ],
     distinct : true    
  });
  const newArray = allUser.map(user => ({...user, ...userDetailArray.find(detail => detail.id === user.id)}))
  const result = newArray.map(user => {
        return Object.assign(
          {},
          {
           id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          dob: user.dob,
          title: user.title,
          gender: user.gender,
          aboutMe: user.aboutMe,
          status: user.status,
          currency: user.user_detail  && user.user_detail.currency ? user.user_detail.currency : '',
          priceMax: user.user_detail  && user.user_detail.priceMax ? user.user_detail.priceMax : 0,
          priceMin: user.user_detail  && user.user_detail.priceMin ? user.user_detail.priceMin : 0,
          activityStatus: user.user_detail  && user.user_detail.activityStatus ? user.user_detail.activityStatus : '',
          skills: user.user_skills.map(skillObj => {
              return skillObj.skill.skill 
          }),
          recommendationCount : user.reccount ? user.reccount : 0
        }
      )
    })
  return {
    count :userDetailAndCount.count,
    rows : result
  };
  
}

export const checkConnectionExist = async (payload, model) => {
  const condition = {
      $or: [
          {
            'userId': {
              [Op.eq]:  payload.userId
            },
            'requestedTo': {
              [Op.eq]:  payload.requestedTo
            },
          },
          {
            'requestedTo': {
              [Op.eq]:  payload.userId
            },
            'userId': {
              [Op.eq]:  payload.requestedTo
            },
          }
        ]
    }
  return model.findOne({
    where: condition
  });
};

export const getNotification = async(payload) => {
  const skip =
    payload && payload["pageNumber"]
      ? (payload["pageNumber"] - 1) * LIMIT.RECORD_PER_PAGE
      : 0;
    const result =  await db.notification.findAndCountAll({
      where: { 
        receiverId: payload.userId, 
        isRead : false
      },
      attributes: [
        "id",
        "notification",
        "isRead",
        "senderId",
        "connectionId"
      ],
      include: [
        {
          model: db.user,
          on: { '$notification.senderId$' : {$col: 'user.id'}},
          attributes: [  
            "firstName",
            "lastName",
            "profileImage",
            "role"
          ],
          include : [ // check if connection status is not ignored
            {
              model: db.user_connection,
              on: {
                $or : {
                 'requestedTo' : {$col: 'user.id'},
                 'userId' : {$col: 'user.id'}
               }
             },
              attributes: ['status'],
              where : {
                'status': {$ne : 3 }, //// if connection is ignored once, request will not be displayed
                $or : {
                 'requestedTo' : payload.userId,
                 'userId' : payload.userId
               }
              }
            }
          ]
        },
        

      ],
      offset: skip,
      limit: LIMIT.RECORD_PER_PAGE,
      order: [['createdAt', 'DESC']],
      subQuery : false
    });
  return result;
}
export const saveConnectionNotification = async(payload) => {
  console.log('payload >>>',payload);
  const notification = payload.status === 2 ? NOTIFICATION_TEXT.CONNECTION_ACCEPTED : NOTIFICATION_TEXT.CONNECTION_REQUESTED;
  const receiverId = payload.requestedTo;
  const userNotification = {
    senderId :  payload.userId,
    notification : notification,
    receiverId : payload.requestedTo,
    connectionId : payload.connectionId
  }
  await db.notification.create(userNotification);
  // send email notification
  const findAttributes = ['firstName', 'lastName', 'email', 'id'];
  const senderDetail = await findOneByConditionWithAtrributes({ id: payload.userId }, findAttributes,
   db.user)
  const receiverDetail = await findOneByConditionWithAtrributes({ id: payload.requestedTo }, findAttributes, db.user)
  const notificationMsg = senderDetail ? senderDetail.dataValues.firstName  + ' ' + senderDetail.dataValues.lastName + ' ' + notification : '';
  const template = await Mail.htmlFromatWithObject({
      data: receiverDetail.dataValues,
      emailTemplate: "connection-request",
      notification: notificationMsg,
  });
  // notification event
  Events.emit("notification", { userData : receiverDetail.dataValues});
  return await CommonMethod.sendEmail(receiverDetail.dataValues, template, Mail.subjects.connectionRequest);
  
}

export const fetchChatUser = async(payload) => {
  const skip =
    payload && payload["pageNumber"]
      ? (payload["pageNumber"] - 1) * LIMIT.CHAT_CONTACT
      : 0;
    const result = await db.chat_user.findAll({
      where : { userId :payload.userId }, 
      attributes : ['chatRoomId'],
     });
    const roomIds = result.map(obj  => {
      return obj.chatRoomId;
    })
    const searchStr =
    payload && payload.search
      ? {
      $or: [
        {
            "$chat_users.user.firstName$": {
              [Sequelize.Op.iLike]:  '%' + payload.search + '%' 
            }
         },
         {
           "$chat_users.user.lastName$" : {
              [Sequelize.Op.iLike]:  '%' + payload.search + '%' 
            }
         },
        //  {
        //  '$chat_messages.message$' : {
        //     [Sequelize.Op.iLike]:  '%' + payload.search + '%' 
        //   }
        // }
      ]
    }
    : '';
    
    const contacts = await db.chat_room.findAndCountAll({
      attributes: ['id'],
      where : searchStr,
      include: [
        {
          model: db.chat_user,
          required: true,
          attributes: ['userId', 'chatRoomId'],
          where : {
            '$chat_users.chatRoomId$' :roomIds,
            '$chat_users.userId$' : {$ne : payload.userId}
          }, 
          include : [
            {
              model: db.user,
              required: false,
              attributes: ['firstName', 'lastName', 'profileImage', 'id']
            },
          ]
        },
        {
          model: db.chat_message,
          required: false,
          attributes: [
            'message',
            'createdAt',
            'chatRoomId',
            'id',
            [Sequelize.literal('(SELECT COUNT(*) FROM "chat_messages" WHERE "chat_messages"."status" = 0 AND "userId" != '+ payload.userId +')'), 'unreadMsg']
          ],
          //where : msgStr,
          separate : true, 
        
          limit: 1,
          order: [
            ['createdAt', 'DESC' ]
          ],
          
        }  
    ], 
    offset: skip,
    limit: LIMIT.CHAT_CONTACT,
    subQuery: false,
    distinct:true,
    order: [['createdAt', 'DESC']]  
  });
  //console.log('contacts >>', JSON.stringify(contacts))
  const resObj = contacts.rows.map(obj => {
        return Object.assign(
          {},
          {
          roomId: obj.id,
          user: obj.chat_users.map(usrObj => {
              return usrObj.user
          }),
          message: obj.chat_messages.map(msgObj => {
              return msgObj
          }),
          timeDiff: obj.chat_messages && obj.chat_messages.length > 0 ? moment(obj.chat_messages[0].createdAt, 'YYYY.MM.DD').fromNow(true)  : ''
        }
      )
    })
  return {
    count :contacts.count,
    rows : resObj
  };
}

export const addChatMedia = async(media) => {
  //console.log('media >>>', media)
  let mediaDir = STATIC_PATH.CHAT_MEDIA;
  let mediaName = '';
  return new Promise((resolve, reject)=>{
    if (!fs.existsSync(mediaDir)){
         fs.mkdirSync(mediaDir, {recursive: true}, err => {
           if(!err) {
             console.log('not error');
           }else {
             reject(err);
           }
       });
    }
    if(media) {
      mediaName = media.name;
      //console.log('mediaName >>>', mediaName)
      mediaName = mediaName.replace(/\s+/g, '-').toLowerCase();
      mediaName = Date.now() + '-' + mediaName;
      let pathFile = mediaDir + mediaName;
      media.mv(pathFile);
    }
    resolve(mediaName);
  });
}

export const getChatMessages = async(payload) => {
  
    await db.chat_message.update({
      status:  1
    }, {
      where: { 
        chatRoomId: payload.roomId, 
        userId :  {$ne :payload.userId}
       }
    })
  const skip =
    payload && payload["pageNumber"]
      ? (payload["pageNumber"] - 1) * LIMIT.RECORD_PER_PAGE
      : 0;
  const messages = await db.chat_message.findAndCountAll({
      where : {
        chatRoomId :payload.roomId
      },
      include : [
        {
          model: db.user,
          attributes: ['firstName', 'lastName', 'id'],
        }
      ],
      offset: skip,
      limit: LIMIT.RECORD_PER_PAGE,
      order: [['createdAt', 'DESC']]  
  });
  const msgObj = messages.rows.map(obj => {
        return Object.assign(
          {},
          {
          id : obj.id,
          message: obj.message,
          createdAt: obj.createdAt,
          timeDiff: moment(obj.createdAt, 'YYYY.MM.DD').fromNow(),
          status : obj.status,
          messageType : obj.messageType,
          media : obj.media,
          firstName : obj.user.firstName,
          lastName : obj.user.lastName,
          userId : obj.user.id
        }
      )
    })
  return {
    count :messages.count,
    rows : msgObj
  };
 }

