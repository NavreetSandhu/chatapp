/*
 * @file: user.js
 * @description: It Contain function layer for user controller.
 * @author: smartData
 */

import { successAction, failAction } from "../utilities/response";
import {
  paswordForgot, saveUser, isEmailExist,onLogin,paswordReset, passwordChange, chkCurrentPassword, activateUserAccount, getUserProfile, updateUserProfile, updateUserSkill, manageUserMedia, userSearch, saveRecommendation, getUserRecommendation, removeRecommendation, manageUserConnection, getUserNotification, updateNotificationStatus, deleteConnection, getUserDetail, getUserConnection, saveReport, getUserContacts, saveChatMedia, fetchRoomMsg, updateChatMessageStatus, updateUserSetting, sendInvitationEmail} from "../services/user";
import Message from "../utilities/messages";
import { ROLE } from "../utilities/constants";
import { sendSms } from "../utilities/universal";


/**************** Email exist check ***********/
export const emailExistCheck = async (req, res, next) => {
  const payload = req.params;
  try {
    const resr = await isEmailExist(payload);
    res.status(200).json(successAction(resr, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};

/**************** Add User ***********/
export const addUser = async (req, res, next) => {
  const payload = req.body;
  //console.log('payload >>>', payload)
  try {
    let data = await saveUser(payload);
    if(data){
    res.status(200).json(successAction(data, Message.userAdded));
    }
    else{
      res.status(400).json(failAction(""));
    }
  } catch (error) {
    console.log("in catch")
    res.status(400).json(failAction(error.message));
  }
};
/**************** Login user ***********/
export const login = async (req, res, next) => {
  const payload = req.body;
  try {
    const data = await onLogin(payload);
    res.status(200).json(successAction(data, Message.success));
  } catch (error) {
    res.status(400).json(failAction(error.message));
  }
};




export const getAllContact = async(req, res, next) => {
  const payload = req.body;
  payload.userId  =  req.user.id
  try {
    let data = await getUserContacts(payload);
    if(data){
      res.status(200).json(successAction(data, Message.contactFetched));
    }
    else{
      res.status(400).json(failAction(""));
    }
  } catch (error) {
    console.log("in catch", error)
    res.status(400).json(failAction(error.message));
  }
}

export const uploadChatMedia = async(req, res, next) => {
  const payload = req.files;
  //payload.userId  =  req.user.id
  try {
    let data = await saveChatMedia(payload);
    if(data){
      res.status(200).json(successAction(data, Message.chatMediaUploaded));
    }
    else{
      res.status(400).json(failAction(""));
    }
  } catch (error) {
    console.log("in catch", error)
    res.status(400).json(failAction(error.message));
  }
}

export const getChatMessages = async(req, res, next) => {
  const payload = req.body;
  payload.userId  =  req.user.id
  try {
    let data = await fetchRoomMsg(payload);
    if(data){
      res.status(200).json(successAction(data, Message.messageFetched));
    }
    else{
      res.status(400).json(failAction(""));
    }
  } catch (error) {
    console.log("in catch", error)
    res.status(400).json(failAction(error.message));
  }
}

