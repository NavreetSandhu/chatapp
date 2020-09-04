/*
 * @file: constants.js
 * @description: It Contain all constants for application.
 * @author: smartData
 */

/****************** Constants ******************/

export const LIMIT = {
  USERS: 10,
  RECORD_PER_PAGE : 10,
  REPORT : 25,
  CHAT_CONTACT: 9
};

export const STATIC_PATH = {
  PROFILE_IMAGE: 'public/uploads/profile_img/',
  IMAGE : 'public/uploads/user_img/',
  THUMBNAIL : 'public/uploads/user_img/thumbnail/',
  CHAT_MEDIA : 'public/uploads/chat/'

};

export const NOTIFICATION_TEXT = {
	CONNECTION_REQUESTED : 'has proposed a connection between you two.', 
	CONNECTION_ACCEPTED : 'has accepted a connection request.',
	CONNECTION_IGNORED : 'has ignored a connection request.'
}

export const NOTIFICATION_CATEGORY = {
  MESSAGE: "message"
};
export const NOTIFICATION_MESSAGE = {
  NEWMESSAGE: "New Message received."
};

export const REPORT_SORT_KEY = {
  REPORTED: "reported",
  HAS_BEEN_REPORTED : "hasBeenReported",
  CREATED_AT : "createdAt"
};

