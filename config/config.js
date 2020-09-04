const env = require('dotenv').config();
const config = {
  JWT_KEY: process.env.JWT_KEY,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
  FRONT_END_URL : process.env.FRONT_END_URL,
  AUTH_USERNAME: process.env.AUTH_USERNAME,
  AUTH_PASSWORD : process.env.AUTH_PASSWORD,
  IMAGE_URL : process.env.IMAGE_URL,
  ADMIN_URL : process.env.ADMIN_URL
 };
 module.exports = config;
