const db = require("../models/");
import fs from 'fs';
import jwt from "jsonwebtoken";
import Jimp from 'jimp';
const path = require("path");
import { STATIC_PATH, LIMIT } from "./../utilities/constants";
import * as Mail from "./../utilities/mail";
import config from "./../config/config";
const { JWT_KEY, JWT_EXPIRY } = config;

export const getAll = async (condition, attributes, model) => {
  return model.findAll({ where: condition, attributes: attributes });
};

export const findOneByCondition = async (condition, attributes, model) => {
  return model.findOne({
    where: condition,
    attributes: attributes,
  });
};

export const findAllByCondition = async (condition, attributes, model) => {
  return model.findAll({
    where: condition,
    attributes: attributes,
  });
};

export const findAllByConditionInclude = async (
  condition,
  attributes,
  include,
  model
) => {
  return model.findOne({
    where: condition,
    attributes: attributes,
    include: include,
  });
};

export const updateOneByCondition = async (recordupdate, condition, model) => {
  return model.update(recordupdate, {
    returning: true,
    where: condition,
  });
};

export const loggedInUserToken = async (token) => {
  const decoded = jwt.verify(token, JWT_KEY);
  if(decoded.id) {
    return db.user.findOne({
        where: { 
          id: decoded.id,
          status : 1
        },
        raw : true 
    });
  }else {
    return false;
  }
  
  
  
};

export const getUserDetails = async (id, model) => {
    return model.findOne({
        where: { "id": id },
    });
}

export const fetchUserProfile = async (userId) => {
  //console.log('userId >>>', userId)
  const user =  await db.user.findOne({
    where: { id: userId },
    attributes: [
      "id",
      "firstName",
      "lastName",
      "email",
      "role",
      "profileImage",
      "dob",
      "title",
      "gender",
      "aboutMe",
      "status"
    ],
    include: [
      {
        model: db.user_detail,
        attributes: [
          "currency",
          "priceMax",
          "priceMin",
          "address",
          "activityStatus",
          "lat",
          "long",
          "radius",
          "id"
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
          ]
        },
        {
        model: db.user_recomendation,
        required: false,
        attributes: [
          "id",
          "recommendation",
          "addedBy",
          "is_active",
          "createdAt",
          "userId"
        ],
        limit: 3,
        order: [
          ['createdAt', 'DESC' ]
        ],
        include: [
            {
              model: db.user,
              attributes: [
                "firstName",
                "lastName",
                "profileImage",
                "role"
              ],
            }
          ],
        },
        {
        model: db.user_social_profile,
        required: false,
        attributes: [
          "id",
          "mediaPlatform",
          "profileId",
          "is_active",
          "createdAt"
        ],
      },
      {
        model: db.user_qualification,
        required: false,
        attributes: [
          "id",
          "qualification",
          "is_active",
          "createdAt",
          "userId"
        ],
        limit: 5,
        order: [
          ['createdAt', 'ASC' ]
        ],
      },
      {
        model: db.user_image,
        required: false,
        attributes: [
          "id",
          "image",
          "is_deleted"
        ],
        where: {
            is_deleted: false,    
        }
      },
      {
        model: db.user_video,
        required: false,
        attributes: [
          "id",
          "link",
          "is_deleted"
        ],
        where: {
            is_deleted: false,    
        }
      },
     ]
  });
  //console.log('user >>', user)
  const all_connection = await fetchUserConnection(userId, 0, db.user_connection, 3)
  console.log('all_connection >>>', JSON.stringify(all_connection))
  const resObj = Object.assign(
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
          user_detail : user.user_detail,
          user_skill: user.user_skills.map(skillObj => {
            return Object.assign(
                {},
                {
                  id: skillObj.id,
                  skillId: skillObj.skillId,
                  skill: skillObj.skill.skill,
                  
                }
              )
          }),
          skills: user.user_skills.map(skillObj => {
              return Object.assign(
                {},
                {
                  skill: skillObj.skill.skill,
                  
                }
              )
          }),
          user_recomendation : user.user_recomendations,
          user_social_profile : user.user_social_profiles,
          user_qualification : user.user_qualifications,
          social_profile : Object.assign({}, ...user.user_social_profiles.map(profileObj => 
            (
              {
                [profileObj.mediaPlatform]: profileObj.profileId
              }
            )
          )),
          user_image : user.user_images,
          user_video : user.user_videos,
          all_connection : all_connection.rows.map(connObj => {
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
          }),
          connection_count : all_connection.count
        }
      )
    
      //console.log('ddd >>', resObj)
      return resObj;
  };

  export const saveImageAndThumbnail = async(image) =>{
    let imgDir = STATIC_PATH.IMAGE;
    let thumbnailImgDir = STATIC_PATH.THUMBNAIL
    let fileImage = '';
    return new Promise((resolve, reject)=>{
      if (!fs.existsSync(imgDir)){
           fs.mkdirSync(imgDir, {recursive: true}, err => {
             if(!err) {
               console.log('not error');
             }else {
               reject(err);
             }
         });
      }
      if (!fs.existsSync(thumbnailImgDir)){
           fs.mkdirSync(thumbnailImgDir, {recursive: true}, err => {
             if(!err) {
               console.log('not error');
             }else {
               reject(err);
             }
         });
      }
      if(image) {
        fileImage = image.name;
        fileImage = fileImage.replace(/\s+/g, '-').toLowerCase();
        fileImage = Date.now() + '-' + fileImage;
        let pathFile = imgDir + fileImage;
        image.mv(pathFile);
        const thumbnailImagePath = thumbnailImgDir + fileImage
        //create thumbnail
        Jimp.read(pathFile, (err, img) => {
          if (err) throw err;
          img
          .resize(150, 150) // resize
          .write(thumbnailImagePath); // save
        });
      }
      resolve(fileImage);
    });
}

/********* Send Email *********/

export const sendEmail = async (payload, result, subject) => {
  //console.log('payload >>>', payload.email)
  const emailData = {
    to: payload.email,
    subject: subject,
    obj: result.html
  };
  //console.log("emailDataemailData >>", emailData)
  Mail.sendMail(emailData, function (err, res) {
    if (err)
      console.log( "Error at sending verify", err);
    else
      console.log("verify mail to user",res);
  });

};

export const fetchUserAssociationData = async(userId, pageNumber, model) => {
  const skip =
    pageNumber 
      ? (pageNumber - 1) * LIMIT.RECORD_PER_PAGE
      : 0;
  const result = await model.findAndCountAll({
      where : {
        is_deleted : false
      },
      offset: skip,
      limit: LIMIT.RECORD_PER_PAGE,
      order: [['createdAt', 'DESC']],
    });
  return result;
}

export const fetchUserRecommendation = async(userId, pageNumber, model) => {
  let skip = pageNumber ? (pageNumber - 1) * LIMIT.RECORD_PER_PAGE: 0;
  const result = await model.findAndCountAll({
      where : {
        is_deleted : false,
        userId : userId
      },  
      include: [
        {
          required: true,
          model: db.user,
          attributes: [
            "firstName",
            "lastName",
            "profileImage",
            "role"
          ],
        }
      ],
      offset: skip,
      limit: LIMIT.RECORD_PER_PAGE,
      order: [['createdAt', 'DESC']],
  });
  return result;
}

export const deleteRecord = async(id, model) => {
  await model.destroy({ where: { id: id} });
  
}

export const checkRecordExist = async (condition, model) => {
  return model.findOne({
    where: condition
  });
};

export const fetchUserConnection = async(userId, pageNumber, model, limit) => {
  let skip = pageNumber ? (pageNumber - 1) * LIMIT.RECORD_PER_PAGE: 0;
  const result = await model.findAndCountAll({
      where : {
        status : 2,
        $or: [
          {
            'userId':  userId,
            
          },
          {
            'requestedTo': userId,
          }
        ]
      },
      include: [
        {
          required: false,
          model: db.user,
          where : { id :  {$ne : userId }},
          attributes: [
            "firstName",
            "lastName",
            "profileImage",
            "role",
            "id",
            "title"
          ],
        },
        {
          required: false,
          model: db.user,
          as : 'connection',
          where : { id :  {$ne : userId } },
          attributes: [
            "firstName",
            "lastName",
            "profileImage",
            "role",
            "id",
            "title"
          ],
        }
      ],
      offset: skip,
      limit: limit ? limit : LIMIT.RECORD_PER_PAGE,
      order: [['createdAt', 'DESC']],
  });
  
  //console.log('result >>>', JSON.stringify(result))

  return result;
}

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

export const getAllFAQ = async() => {
  const result = await db.faq.findAll({ raw:true});
  const newArray = result.reduce(function(acc, curr) {
    const findKeyExist = acc.findIndex(function(item) {
      return item.role === curr.role;
    })
    if (findKeyExist === -1) {
      let obj = {
      "role": curr.role,
      "data": [curr]
    }
    acc.push(obj)
    } else {
      acc[findKeyExist].data.push(curr)
    }
    return acc;
  }, []);
  return newArray;
}
