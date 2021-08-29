const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
  const PhotosCategories = sequelize.define('photoscategory', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    categoryName: DataTypes.STRING,

  }, {
    tableName: 'photoscategories'
  });

  PhotosCategories.associate = function (models) {
    PhotosCategories.hasMany(models.photo, { foreignKey: 'categoryId' })
    
  }

  // PhotosCategories.prototype.getPublicProfile = function () {
  //   const appointment = this
  //   const publicData = _.pick(appointment, ['id', 'day', 'appointmentDate', 'startTime',
  //     'endTime', 'title', 'description'])
  //   return publicData
  // }

  // PhotosCategories.validate = function (req) {
  //   let schema = Joi.object({
  //     day: Joi.string().min(3).required(),
  //     date: Joi.date().required(),
  //     startTime: Joi.string().pattern(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')).required(),
  //     endTime: Joi.string().pattern(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')).required(),
  //     type: Joi.string().min(3).required(),
  //     description: Joi.string().min(10).required(),
  //     status: Joi.string().min(3).required(),
  //     doctorId: Joi.number().required(),
  //     patientId: Joi.number(),
  //     sessionId: Joi.number()
  //   });

  //   return schema.validate(req);
  // }

  return PhotosCategories

}