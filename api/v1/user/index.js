/*
 * @file: index.js
 * @description: It's combine all user routers.
 * @author: smartData
 */

import signUp from "./sign-up";
import login from "./login";
import chatContact from "./chat_contact";
import chatMedia from "./chat-media";
import chatMessage from "./chat-message";

export default [
  signUp,
  login,
  chatContact,
  chatMedia,
  chatMessage
];

