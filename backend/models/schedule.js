// 'use strict';
// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class schedule extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   schedule.init({
//     tags: DataTypes.STRING,
//     appointment_name: DataTypes.STRING,
//     description: DataTypes.STRING,
//     time: DataTypes.DATE
//   }, {
//     sequelize,
//     modelName: 'schedule',
//   });
//   return schedule;
// };

const { DataTypes } = require('sequelize');
const { sequelize } = require('../helper/connectionDB');

const Notification = sequelize.define('Schedule', {
  owner: {
    type: DataTypes.STRING,
    allowNull: false
  },
  timeCreated: {
    type: DataTypes.DATE,
    allowNull: false
  },
  timeAppointed: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointmentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sendTo: {
    type: DataTypes.STRING,
  },
  content: {
    type: DataTypes.TEXT,
  },
}
);

module.exports = Notification;

