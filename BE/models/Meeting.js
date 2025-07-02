const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/db');

const Meet = sequelize.define('Meet', {
  room_code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Meet;
