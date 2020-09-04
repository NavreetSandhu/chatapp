/*
 * @file: user.js
 * @description: It Contain function layer for user service.
 * @author: smartData
 */
const model = require("../../models/");
import Message from "../../utilities/messages";
const jwt = require('jsonwebtoken')
import config from "../../config/config";
const {FRONT_END_URL} = config;
const moment = require("moment")
import { uuid } from 'uuidv4';

import {
  encryptpassword,
  generateToken,
  getTimeStamp
} from "../../utilities/universal";
import {
  checkEmail,
  findOneByCondition,
  updateOneByCondition,
  generateJwtToken,
  logout,
  uploadBase64Image,
  updateOrInsert,
  manageUserSkill,
  searchAllUser,
  checkConnectionExist,
  getNotification,
  findOneByConditionWithAtrributes,
  saveConnectionNotification,
  fetchChatUser,
  addChatMedia,
  getChatMessages
} from "./method";
import * as Mail from "../../utilities/mail";
import { ROLE } from "../../utilities/constants";
import * as CommonMethod from "./../common_method";
import { NOTIFICATION_TEXT } from "./../../utilities/constants";

export const isEmailExist = async (payload) => {
  let newUser = await checkEmail({ email: payload.email }, model.user);
  if (!newUser) {
    throw new Error(Message.emailNotExists);
  }
  return newUser;
};

/********** Save users **********/
export const saveUser = async (payload) => {
  //console.log('saveUSer >>', payload)
  let userInfo = {};
  if(payload.email){
    const emailExist = await checkEmail({ email: payload.email }, model.user)
    if(emailExist)
    throw new Error(Message.emailAlreadyExists);
  }
  if(payload.skills && payload.skills.length > 5) {
    throw new Error(Message.keySkillLengthExceeded);
  }
  let profileImage;
  if(payload.profilePic) {
    profileImage = await uploadBase64Image(payload.profilePic);
  }
  userInfo.password = payload.password ? encryptpassword(payload.password):"";
  userInfo.profileImage = payload.profilePic ? profileImage : "";  
  userInfo.email = payload.email
  userInfo.firstName = payload.firstName;
  userInfo.lastName = payload.lastName;
  userInfo.gender = payload.gender;
  userInfo.enquiry = payload.enquiry;
  userInfo.dob = payload.dob ? payload.dob : '';
  userInfo.role = payload.role;
  const userData = await model.user.create(userInfo);
  if(payload.role == 1) { //save additional professional info
      let userDetail = { 
        userId:userData.id ,
        currency : payload.currency ? payload.currency : '',
        priceMax : payload.priceMax ? payload.priceMax : 0,
        priceMin: payload.priceMin ? payload.priceMin : 0,
        lat : payload.lat ? payload.lat : '',
        long : payload.long ? payload.long : '',
        address : payload.address ? payload.address : '',
        radius : payload.radius ? payload.radius : 0,
        activityStatus : payload.activityStatus ? payload.activityStatus : '',
      }
      await model.user_detail.create(userDetail);
      if(payload.skills && payload.skills.length > 0) { //save key skills
        const userSkills = payload.skills.map(function(item){
          return {
            userId  : userData.id,
            skillId : item
          } 
        })
        //console.log('userSkills >>>', userSkills)
        await model.user_skill.bulkCreate(userSkills, {returning: true});
      }
    }
    //save user registation token
      let token = uuid();
      let tokenInfo = {
        userId: userData.id,
        token : token,
        expiredOn: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      }
      await model.registration_token.create(tokenInfo);
       const result = await Mail.htmlFromatWithObject({
        data: userData,
        emailTemplate: "welcome-email",
        url: `${FRONT_END_URL}account-verification/`+token,
      });
       //console.log('sas >>>', payload.email)
     sendEmail(payload, result,'New Register', Mail.subjects.welcomeEmail)
     
     return userData;
};

/********** Login users **********/
export const onLogin = async (payload) => {
  const userData = await findOneByCondition(
    {
      email: payload.email,
      password: encryptpassword(payload.password)
    },
    model.user
  );
  //console.log('sdasd >>>', userData.id, userData.firstName, userData.is_active)
  if (!userData) throw new Error(Message.invalidCredentials);
  if (!userData.is_active) throw new Error(Message.userInactive);
  if(!userData.status) throw new Error(Message.userBlocked)
  let loginToken = await generateJwtToken(userData);
  const lastLogin = {
      last_login:  getTimeStamp()
    };
  await updateOneByCondition(lastLogin, { id: userData.id}, model.user);
  //console.log('loginToken >>>', loginToken)
  return {
    id: userData._id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role_id: userData.role,
    loginToken: loginToken,
    last_login : userData.last_login
  };
};


// Forgot password function and send link to email for reset password
export const paswordForgot = async (payload) => {
  if (!payload.email) throw new Error(Message.validEmail);
  payload.email = payload.email.toLowerCase();
  const userData = await checkEmail({ email: payload.email }, model.user);
  if (!userData) throw new Error(Message.emailNotExists);
  if (!userData.is_active) throw new Error(Message.userInactive);
  let token = uuid();
  let tokenInfo = {
    userId: userData.id,
    token : token,
    expiredOn: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  }
  await model.reset_pwd_token.create(tokenInfo);
   const result = await Mail.htmlFromatWithObject({
    data: userData,
    emailTemplate: "forgot-password",
    url: `${FRONT_END_URL}reset-password/`+token,
  });
  
 await sendEmail(payload, result,"forgot-password",Mail.subjects.forgetPassword)
  return tokenInfo
};

// Reset password function get otp
export const paswordReset = async (payload) => {
  let condition = { token: payload.token };
    const validateToken = await model.reset_pwd_token.findOne({where : condition});
    if (!validateToken) throw new Error(Message.incorrectToken);
    
    let format = 'YYYY-MM-DD HH:mm';
    let dateTime = new Date();
      dateTime = moment(dateTime).format("YYYY-MM-DD HH:mm");
      dateTime = moment(dateTime, format)
    let createdDate = moment(validateToken.dataValues.createdAt, format) 
    let expiredDate = moment(validateToken.dataValues.expiredOn, format)
    if(!dateTime.isBetween(createdDate, expiredDate,  null, '[]')) {
      throw new Error(Message.tokenExpired);
    }
    const tokenData = {
      token: ''
    };
    await updateOneByCondition(tokenData, { id: validateToken.dataValues.id }, model.reset_pwd_token);
    const passwordData = {
      password: encryptpassword(payload.password),
    };
  return await updateOneByCondition(passwordData, { id: validateToken.dataValues.userId }, model.user);
};


/********* Update user info *********/
export const updateUserInfo = async (payload) => {
  return await User.updateUser(payload);
};
/********* get user list *********/
export const getUsers = async () => {
  return await User.findByCondition({ role: { $ne: ROLE.ADMIN } });
};
/********* Send Email *********/
export const sendEmail = async (payload,result,templateid,subject) => {
  //console.log('payload >>>', payload.email)
  const emailData = {
    to: payload.email,
    subject: subject,
    obj: result.html,
    templateId:templateid ,
  };
  //console.log("emailDataemailData >>", emailData)
  Mail.sendMail(emailData, function (err, res) {
    if (err)
      console.log( "Error at sending verify", err);
    else
      console.log("verify mail to user",res);
  });

};
  
export const activateUserAccount = async (token) => {
   let condition = { token: token };
    const validateToken = await model.registration_token.findOne({where : condition});
    if (!validateToken) throw new Error(Message.incorrectToken);
    
    let format = 'YYYY-MM-DD HH:mm';
    let dateTime = new Date();
      dateTime = moment(dateTime).format("YYYY-MM-DD HH:mm");
      dateTime = moment(dateTime, format)
    let createdDate = moment(validateToken.dataValues.createdAt, format) 
    let expiredDate = moment(validateToken.dataValues.expiredOn, format)
    if(!dateTime.isBetween(createdDate, expiredDate,  null, '[]')) {
      throw new Error(Message.tokenExpired);
    }
    const tokenData = {
      token: ''
    };
    await updateOneByCondition(tokenData, { id: validateToken.dataValues.id }, model.registration_token);
    const secondaryEmailExist = await model.user.findOne(
        {
          where : {
            id : validateToken.dataValues.userId 
          },
          raw : true 
        }
    );
    const userData = secondaryEmailExist.secondaryEmail ? 
      {
        email : secondaryEmailExist.secondaryEmail,
        secondaryEmail : ''

      } : 
      {
        is_active: true
      };
    //console.log('userData >>', userData)
    return await updateOneByCondition(userData, { id: validateToken.dataValues.userId }, model.user);
};

export const getUserProfile = async (payload) => {
  //console.log('payload >>>', payload)
  let profileData = await CommonMethod.fetchUserProfile(payload.userId);
  //check user connection status
  const condition = {
    userId : payload.loggedInId,
    requestedTo : payload.userId
  }
  const connectionDetail = await checkConnectionExist(condition, model.user_connection)
  const connectionObj = Object.assign({},
    {
      id: connectionDetail ? connectionDetail.id : '',
      status: connectionDetail ? connectionDetail.status : '',
      requestedTo : connectionDetail ? connectionDetail.userId : '',
   }
  )
  profileData.user_connection = connectionObj
  return profileData;
}

export const updateUserProfile = async(payload) => {
  if(payload.userData && payload.userData.length > 0) { //insert or update
    let result = {};
    let modelName = payload.section;
    let userId = payload.userId; 
    let profileImage = '';
    let condition = {};
    if(modelName === 'user') {
      let userDetailKeys = ['priceMax', 'priceMin', 'activityStatus'];
      let userDetailObj = {};
      let userObj = {};
      //console.log('payload.userData[0].profilePic >>>', payload.userData[0].profilePic)
      if('profilePic' in payload.userData[0]) {
        console.log('in 259')
        if(payload.userData[0].profilePic) {
          profileImage = await uploadBase64Image(payload.userData[0].profilePic);
        }
        userObj.profileImage = profileImage ? profileImage : '';
      }
      //manage user and user detail keys individually
      Object.keys(payload.userData[0]).forEach(function (key) {
        if(userDetailKeys.indexOf(key) > -1) {
          userDetailObj[key] = payload.userData[0][key]
        }else {
          userObj[key] = payload.userData[0][key]
        }
      });
      if (Object.keys(userDetailObj).length !== 0) {
        let condition = {
          userId : userId
        }
        await updateOrInsert(userDetailObj, condition, model.user_detail); 
      }
      let checkCondition = {
          id : userId
        }
      return await updateOrInsert(userObj, checkCondition, model.user); 
    }else {
      for (const item of payload.userData) {
        let updateObj = { 
           userId, ...item
        }
        let condition = {
          userId : userId,
          id : item.id
        }
        await updateOrInsert(updateObj, condition, model[modelName]);
      }
      return true
    }
     
  } 
}

export const updateUserSkill = async(payload) => {
  console.log('payload.skills.length >>>', payload.skills.length)
  if(payload.skills && payload.skills.length > 5) {
    throw new Error(Message.keySkillLengthExceeded);
  }
  let result = await manageUserSkill(payload, model.user_skill);
  return result;
}

export const manageUserMedia = async(payload) => {
  let modelName = payload.body.section;
  let userId = payload.userId; 
  let image;
  if(modelName === 'user_image') {
    if(payload.files && payload.files.userData) {
      let uploadedImage = payload.files.userData;
      if (!Array.isArray(uploadedImage)) {
        uploadedImage = new Array(uploadedImage);
      }
      let imageArray = [];
      if(uploadedImage.length > 0) { 
        for (const item of uploadedImage) {
          if(item) {
            image = await CommonMethod.saveImageAndThumbnail(item);
            imageArray.push( { image: image, userId: userId})
          }
        }
        return await model[modelName].bulkCreate(imageArray, {returning: true});
      }
    }else {
       if(payload.body && payload.body.userData.length > 0) {
        for (const item of payload.body.userData) {
          let updateObj = { 
             userId, ...item
          }
          let condition = {
            userId : userId,
            id : item.id
          }
          await updateOrInsert(updateObj, condition, model[modelName]);
        }
        return true
      }
    }
  }else {
    for (const item of payload.body.userData) {
      let updateObj = { 
         userId, ...item
      }
      let condition = {
        userId : userId,
        id : item.id
      }
      await updateOrInsert(updateObj, condition, model[modelName]);
    }
    return true
  }  
}

export const userSearch = async(payload) => {
  let result = await searchAllUser(payload);
  return result;
}

export const saveRecommendation = async(payload) => {
  //console.log('payload >>', payload)
  let recObj = {
    userId : payload.userId,
    recommendation : payload.recommendation,
    addedBy : payload.addedBy
  }
  let condition = {
    id : payload.id
  }
  await updateOrInsert(recObj, condition, model.user_recomendation);
  let result = CommonMethod.fetchUserRecommendation(payload.userId, payload.pageNumber, model.user_recomendation)
  return result;
}

export const getUserRecommendation = async(payload) => {
    let result = CommonMethod.fetchUserRecommendation(payload.userId, payload.pageNumber, model.user_recomendation)
  return result;
}

export const removeRecommendation = async(payload) => {
  console.log('payload >>>', payload)
   await CommonMethod.deleteRecord(payload.id, model.user_recomendation)
  let result = CommonMethod.fetchUserRecommendation(payload.userId, payload.pageNumber, model.user_recomendation)
  return result;
}

export const manageUserConnection = async(payload) => {
  let result = {};
  if(payload && payload.id && payload.status !== 3) {
    payload.connectionId = payload.id;
    const statusUpdate = {
      status:  payload.status
    };
    result = await model.user_connection.update({
      status:  payload.status
    }, {
      where: { id: payload.id },
      returning: true
    })
  }else {
    if(payload.userId === payload.requestedTo) 
      throw new Error(Message.requestedToMatched);
    const connectionExist = await checkConnectionExist(payload, model.user_connection)
    if(connectionExist)
      throw new Error(Message.connectionExist);
      payload.status = payload.status ? payload.status : 1; //Pending
      result = await model.user_connection.create(payload)
      payload.connectionId = result.dataValues.id
  }
  //save notification if connection is requested/accepted, if ignored notification will not be saved
  if(payload.status !== 3) {
    await saveConnectionNotification(payload)
  }
  console.log('result >>>', result)
  return result
}

export const getUserNotification = async(payload) => {
  const result =  await getNotification(payload);
  return result;
}

export const updateNotificationStatus = async(payload) => {
  const recordExist = await CommonMethod.checkRecordExist({ id: payload.id }, model.notification)
  if(!recordExist)
    throw new Error(Message.noRecordExist);
  const statusUpdate = {
    isRead:  true
  };
  const result = await model.notification.update({
    isRead:  true
  }, {
    where: { id: payload.id },
    returning: true,
    plain: true
  })
  if(payload.status && payload.status  !== 3) { // if status is accepted
    //console.log('result >>',recordExist.dataValues.connectionId);
    //update connection status 
    const updateResult = await model.user_connection.update({
      status: payload.status
    }, {
      where: { id: recordExist.dataValues.connectionId },
      returning: true,
      plain: true
    })
    const resultStatus = { 
      requestedTo: recordExist.dataValues.senderId, 
      status: payload.status, 
      userId: payload.userId, 
      connectionId: recordExist.dataValues.connectionId 
    }
    await saveConnectionNotification(resultStatus)
  }
  const data =  await getNotification(payload);
  return data;
}

export const deleteConnection = async(payload) => {
  return await CommonMethod.deleteRecord(payload.id, model.user_connection)
}

export const getUserDetail = async (payload) => {
  let profileData = await CommonMethod.fetchUserProfile(payload);
  return profileData;
}

export const getUserConnection = async(payload) => {
  //console.log('adADdD >>', payload)
  const all_connection =  await CommonMethod.fetchUserConnection(payload.userId, payload.pageNumber, model.user_connection);
  //console.log('all_connection >>>', JSON.stringify(all_connection))
  const result = all_connection.rows.map(connObj => {
    let myObj = {};
    if(connObj.user != null && typeof(connObj.user) == "object") {
      myObj = connObj.user;
    } else {
      myObj = connObj.connection;
    }
    return Object.assign(
        {},
        {
          id: connObj.id,
          status : connObj.status,
          firstName : myObj.firstName,
          lastName : myObj.lastName, 
          profileImage : myObj.profileImage,
          role : myObj.role,
          title : myObj.title
        }
      )
  })
  return {
    count: all_connection.count,
    rows : result
  };
}

export const saveReport = async(payload) => {
  if(payload.userId === payload.reportedUserId) 
    throw new Error(Message.reportedUserIdMatched);
  return await model.report.create(payload);
} 

export const getUserContacts = async(payload) => {
  const result =  await fetchChatUser(payload);
  return result
}

export const saveChatMedia = async(payload) => {
  const result =  await addChatMedia(payload.chatMedia);
  return result

}

export const fetchRoomMsg = async(payload) => {
  const result =  await getChatMessages(payload);
  return result
}

export const updateUserSetting = async(payload) => {
  console.log('payload >>>', payload) 
  let result = {};
  if(payload.oldPassword && payload.password) {
    if(payload.oldPassword) {
      const userData = await findOneByCondition(
        {
          id: payload.userId,
          password: encryptpassword(payload.oldPassword)
        },
        model.user
      );
    if (!userData) throw new Error(Message.passwordNotMtchedError);
      const password = {
        password: encryptpassword(payload.password)
      };
      result = await updateOneByCondition(password, { id: payload.userId }, model.user);
    }
  }else if(payload.newEmail && payload.email) {
    if(payload.newEmail === payload.email) 
      throw new Error(Message.emailCantbeSame);

    const emailExist = await checkEmail({ email: payload.newEmail }, model.user)
    if(emailExist)
    throw new Error(Message.emailAlreadyExists);
    
    const userInfo = {
      secondaryEmail : payload.newEmail
    };
    result = await updateOneByCondition(userInfo, { id: payload.userId }, model.user);
   
    //send email with activation email to user new email address and save user setting token
      let token = uuid();
      let tokenInfo = {
        userId: payload.userId,
        token : token,
        expiredOn: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      }
      await model.registration_token.create(tokenInfo);
      const template = await Mail.htmlFromatWithObject({
        data: result,
        emailTemplate: "email-updated",
        url: `${FRONT_END_URL}account-verification/`+token,
      });
      
     sendEmail({email: payload.newEmail}, template,'Email Address Updated', Mail.subjects.emailUpdated)

  }else {
    const userDetail = {
      currency: payload.currency
    };
    await updateOneByCondition(userDetail, { userId: payload.userId }, model.user_detail);

    const userData = {
        dob: payload.dob,
        gender : payload.gender
    };
    result = await updateOneByCondition(userData,{ id: payload.userId }, model.user);
  }
  return result;
}

export const sendInvitationEmail = async(payload) => {
  const emailExist = await checkEmail({ email: payload.email }, model.user)
    if(emailExist)
    throw new Error(Message.emailAlreadyExists);
  const userDetail = await model.user.findOne(
        {
          where : {
            id : payload.userId 
          },
          raw : true 
        }
    );
  const result = await Mail.htmlFromatWithObject({
      data: userDetail,
      emailTemplate: "invite-professional",
      url: `${FRONT_END_URL}`,
  });
  //console.log('result >>>', result)
  await CommonMethod.sendEmail(payload, result,'Invite Professional', Mail.subjects.inviteProfessional)
  return true;
 
}
export const fetchAllFAQByRole = async(payload) => {
  const result = await CommonMethod.getAllFAQ()
  return result;
}

