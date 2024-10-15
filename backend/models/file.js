// 'use strict';
// const {
//   Model
// } = require('sequelize');
// module.exports = (sequelize, DataTypes) => {
//   class File extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//     }
//   }
//   File.init({
//     filename: DataTypes.STRING,
//     filepath: DataTypes.STRING,
//     hash: DataTypes.STRING,
//     size: DataTypes.BIGINT,
//     timestamp: DataTypes.DATE,
//     deleted: DataTypes.BOOLEAN
//   }, {
//     sequelize,
//     modelName: 'File',
//   });
//   return File;
// };

// models/file.js
const { DataTypes } = require('sequelize');
const {sequelize} = require('../helper/connectionDB');

const File = sequelize.define('File', {
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: true, 
  },
  version: {
    type: DataTypes.BIGINT,
    allowNull: true, 
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: true, 
  },
  deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: true, 
  },
  owners: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  tag: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  editor: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
});

module.exports = File;
