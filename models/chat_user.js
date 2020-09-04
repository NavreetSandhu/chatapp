"use strict";
module.exports = (sequelize, DataType) => {
  const chat_user = sequelize.define("chat_user",
    {
      id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        validate: {
          isNumeric: true
        }
      },
      userId: {  //sinle or group chat
        type: DataType.INTEGER,
        allowNull: false
      },
      chatRoomId: {  
        type: DataType.INTEGER,
        allowNull: false
      },
    },
    { timestamps: true },
  );
  chat_user.associate = function(models) {
    chat_user.belongsTo(models.chat_room, {foreignKey: 'chatRoomId'})
    chat_user.belongsTo(models.user, {foreignKey: 'userId'})
  };
  return chat_user;
};
