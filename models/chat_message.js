"use strict";
module.exports = (sequelize, DataType) => {
  const chat_message = sequelize.define("chat_message",
    {
      id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        validate: {
          isNumeric: true
        }
      },
      chatRoomId: {  
        type: DataType.INTEGER,
        allowNull: false
      },
      userId: { // sender id
        type: DataType.INTEGER,
        allowNull: false
      },
      message: {
        type: DataType.TEXT
      },
      messageType: { // 1=> text, 2=> media
        type: DataType.INTEGER, 
        defaultValue : 1
      }, 
      status: {  // 0=> unread, 1=> read, 2=> deleted
        type: DataType.INTEGER, 
        defaultValue : 0
      }, 
      media: { 
        type: DataType.STRING,
        allowNull: true,
      },
    },
    { timestamps: true },
  );
  chat_message.associate = function(models) {
    chat_message.belongsTo(models.chat_room, {foreignKey: 'chatRoomId'}),
    chat_message.belongsTo(models.user, {foreignKey: 'userId'})
  };
  return chat_message;
};
