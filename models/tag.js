//Packages
const _ = require('lodash')
const Joi = require('joi')

module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('tag', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    check: DataTypes.INTEGER,
    review: DataTypes.INTEGER,
    consultation: DataTypes.INTEGER,
    doctorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'doctor',
        key: 'id'
      }
    },


  }, {
    tableName: 'tags'
  });

  Tag.associate = function (models) {
    Tag.belongsTo(models.doctor, { foreignKey: 'doctorId' })
  }

  Tag.prototype.getPublicData = function () {
    const tag = this
    const publicData = _.pick(tag, ['id', 'check', 'review', 'consultation', 'doctorId'])
    return publicData
  }

  Tag.validate = function (req) {
    const schema = Joi.object({
      check: Joi.number().required(),
      review: Joi.number().required(),
      consultation: Joi.number().required(),
      doctorId: Joi.number()
    });

    return schema.validate(req);
  }

  return Tag

}