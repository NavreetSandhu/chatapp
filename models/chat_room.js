"use strict";
module.exports = (sequelize, DataType) => {
  const chat_room = sequelize.define("chat_room",
    {
      id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        validate: {
          isNumeric: true
        }
      },
      name: {  
        type: DataType.INTEGER,
        allowNull: true
      },
      createdBy: {
        type: DataType.INTEGER,
        allowNull: false
      },
      type: { // 1=> single, 2=> group, client may 
        type: DataType.INTEGER,
        allowNull: true,
        defaultValue : 1
      },
      
    },
    { timestamps: true },
  );
  chat_room.associate = function(models) {
    chat_room.hasMany(models.chat_user);
    chat_room.hasMany(models.chat_message);
    chat_room.belongsTo(models.user, {foreignKey: 'createdBy'})
  };
  return chat_room;
};
