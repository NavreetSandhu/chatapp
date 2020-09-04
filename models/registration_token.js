"use strict";
module.exports = (sequelize, DataType) => {
  const registration_token = sequelize.define("registration_token",
    {
      id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        validate: {
          isNumeric: true
        }
      },
      userId: {
        type: DataType.INTEGER,
        allowNull: false
      },
      status: {
        type: DataType.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      token: {
        type: DataType.STRING,
        defaultValue: true,
        allowNull: false
      },
      expiredOn: {
        type: DataType.DATE,
        allowNull: false,
      }
    },
    { timestamps: true }
  );
  return registration_token;
};
