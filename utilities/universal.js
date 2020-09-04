/*
 * @file: universal.js
 * @description: It Contain function layer for all commom function.
 * @author: smartData
 */
import md5 from "md5";
import jwt from "jsonwebtoken";
import { failAction } from "./response";
import Message from "./messages";
import * as COMMONMethod from "./../services/common_method";
import config from "./../config/config";
const db = require("../models/");
const { JWT_KEY, JWT_EXPIRY } = config;

 
/* Get timestamp */
export const getTimeStamp = () => {
  return Date.now();
};

// password encryption.
export const encryptpassword = (password) => {
  return md5(password);
};
// Generate random strings.
export const generateRandom = (length = 32, alphanumeric = true) => {
  let data = "",
    keys = "";

  if (alphanumeric) {
    keys = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  } else {
    keys = "0123456789";
  }

  for (let i = 0; i < length; i++) {
    data += keys.charAt(Math.floor(Math.random() * keys.length));
  }
  return data;
};
/*********** Generate JWT token *************/
export const generateToken = (data) =>

  jwt.sign(data, JWT_KEY, { expiresIn: JWT_EXPIRY});
/*********** Decode JWT token *************/
export const decodeToken = (token) => jwt.verify(token, JWT_KEY);
/*********** Verify token *************/

export const checkToken = async (req, res, next) => {
  const token = req.headers["authorization"];
  let decoded = {};
  try {
    decoded = jwt.verify(token, JWT_KEY);
    if(!decoded.id) throw new Error(Message.incorrectToken);
  } catch (err) {
    return res.status(401).json(failAction(Message.incorrectToken, 401));
  }
  
  const user = await COMMONMethod.findOneByCondition(
    {
      id: decoded.id,
      status : 1
    },
    [
      "id", "status"
    ],
    db.user
  );
  if (user) {
    req.user = decoded;
    next();
  } else {
    res.status(401).json(failAction(Message.incorrectToken, 401));
  }
};

export const addLogs = async (data,modal) => {
  return await modal.create(data)
};

export const checkAdminToken = async (req, res, next) => {
  const token = req.headers["authorization"];
  let decoded = {};
  try {
    decoded = jwt.verify(token, JWT_KEY);
    if(!decoded.id) throw new Error(Message.incorrectToken);
  } catch (err) {
    return res.status(401).json(failAction(Message.incorrectToken, 401));
  }
  
  const user = await COMMONMethod.findOneByCondition(
    {
      id: decoded.id,
      status : 1
    },
    [
      "id", "status"
    ],
    db.admin
  );
  if (user) {
    req.user = decoded;
    next();
  } else {
    res.status(401).json(failAction(Message.incorrectToken, 401));
  }
};

