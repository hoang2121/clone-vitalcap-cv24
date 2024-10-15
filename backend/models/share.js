// 'use strict';
// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class coowner extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   coowner.init({
//     email: DataTypes.STRING,
//     sid: DataTypes.INTERGER
//   }, {
//     sequelize,
//     modelName: 'coowner',
//   });
//   return coowner;
// };

const { DataTypes } = require('sequelize');
const { sequelize } = require('../helper/connectionDB');

const Share = sequelize.define('Share', {

  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  permission: {
    type: DataTypes.STRING,
    defaultValue: "view"
  }

});

module.exports = Share;
