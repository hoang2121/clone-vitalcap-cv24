// 'use strict';
// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class notification extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   notification.init({
//     title: DataTypes.STRING,
//     content: DataTypes.TEXT,
//     owner: DataTypes.STRING,
//     isRead: DataTypes.BOOLEAN
//   }, {
//     sequelize,
//     modelName: 'notification',
//   });
//   return notification;
// };

const { DataTypes } = require('sequelize');
const { sequelize } = require('../helper/connectionDB');

const Notification = sequelize.define('Notification', {

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timeStamp: {
    type: DataTypes.DATE,
    allowNull: false
  },

}
);

module.exports = Notification;

