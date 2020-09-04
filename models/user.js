"use strict";
module.exports = (sequelize, DataType) => {
  const user = sequelize.define("user",
    {
      id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        validate: {
          isNumeric: true
        }
      },
      firstName: {
        type: DataType.STRING,
        allowNull: false
      },
      lastName: {
        type: DataType.STRING,
        allowNull: false
      },
      email: {
        type: DataType.STRING,
        allowNull: false
      },
      password: {
        type: DataType.STRING,
        allowNull: false
      },
      role: {
        type: DataType.INTEGER,
        allowNull: false
      },
      profileImage: {
        type: DataType.STRING,
      },
      dob: {
        type: DataType.DATE,
      },
      enquiry : {
        type: DataType.STRING,
      },
      is_active: { // manage if user have activated his/her account
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      is_deleted : {
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      last_login : {
        type : DataType.DATE
      },
      title : {
        type: DataType.STRING,
      },
      gender: {
        type: DataType.STRING
      },
      aboutMe: {
        type: DataType.TEXT
      },
      status: {  // handle if admin have blocked, or suspended user account i.e 1 active, 0 blocked
        type: DataType.INTEGER,
        defaultValue: 1,
      },
      secondaryEmail : {
        type: DataType.STRING
      }
    },
    { timestamps: true }
  );
  
 
  return user;
};
