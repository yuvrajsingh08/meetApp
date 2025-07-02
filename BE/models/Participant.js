const { DataTypes } = require('sequelize');
const {sequelize }= require('../config/db');
const Meet = require('./Meeting');

const Participant = sequelize.define('Participant', {
  display_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  camera_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  mic_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Meet.hasMany(Participant, { onDelete: 'CASCADE' });
Participant.belongsTo(Meet);

module.exports = Participant;
