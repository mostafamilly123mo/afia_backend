//Packages
const _ = require('lodash')
const Joi = require('joi')

module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('review', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    message: DataTypes.TEXT,
    date: DataTypes.DATEONLY,
    readed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    patientId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'patient',
        key: 'id'
      }
    },


  }, {
    tableName: 'reviews'
  });

  Review.associate = function (models) {
    Review.belongsTo(models.patient, { foreignKey: 'patientId' })
  }

  Review.prototype.getPublicData = function () {
    const review = this
    const publicData = _.pick(review, ['id', 'message', 'date', 'readed', 'patientId'])
    return publicData
  }

  Review.validate = function (req) {
    const schema = Joi.object({
      message: Joi.string().min(10).required(),
      readed: Joi.boolean(),
      patientId: Joi.number()
    });

    return schema.validate(req);
  }

  return Review

}