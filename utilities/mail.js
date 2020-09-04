/* -----------------------------------------------------------------------
   * @ description : Here initialising nodemailer transport for sending mails.
----------------------------------------------------------------------- */

import nodemailer from "nodemailer";
import config from "./../config/config";
const {FRONT_END_URL, AUTH_PASSWORD, AUTH_USERNAME, IMAGE_URL} = config;
import path from "path";
import { EmailTemplate } from "email-templates";

const transporter = nodemailer.createTransport(
    {
      service: "Gmail",
         auth: {
            user: AUTH_USERNAME, // generated ethereal user
            pass: AUTH_PASSWORD  // generated ethereal password
         }
    }
);

export const sendMail = (request, cb) => {
  let options = {
    //from: mailFrom,
    to: request.to, // list of receivers
    subject: request.subject, // Subject line
    html: request.obj // html body
  };
  if (request.cc) {
    options.cc = request.cc;
  }
  if (request.replyTo) {
    options.replyTo = request.replyTo;
  }
  if (request.files) {
    options.attachments = [
      {
        // filename: request.files.fileName,
        path: request.files.content
        // type: 'application/pdf',
        // disposition: 'attachment'
      }
    ];
  }
  transporter.sendMail(options, function (error, info) {
    cb(error, info);
  });
};
export const subjects = {
  
  welcomeEmail: "Welcome to Athleqe!",
  forgetPassword: "Forgot Password",
  blockOrUnblockUser : "Athleqe User Account",
  connectionRequest : "Athleqe User Connection",
  athleqeLaunch : "Athleqe launch",
  emailUpdated: "Email Address Updated",
  inviteProfessional : "Invite Professional"

};

const dirPath = "./../email-templates/";

export const htmlFromatWithObject = async request => {
  //console.log('request >>>', request)
  request['action'] = request.action; 
  request['logo'] = `${IMAGE_URL}public/logo.png`;
  console.log('request >>', request) 
  const tempDir = path.resolve(__dirname, dirPath, request.emailTemplate);
  //console.log('tempDir >>>', tempDir)
  const template = new EmailTemplate(path.join(tempDir));
  const html = await template.render({ ...request});
  //console.log('html >>>', html)
  return {...html,request }
};

