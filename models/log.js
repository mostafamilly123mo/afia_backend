//Packages
const _ = require('lodash')
const Joi = require('joi')

module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('log', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    message: DataTypes.TEXT,
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Admin', 'Doctor', 'Patient', 'Nurse']],
          msg: "Type must be one of the following: [Admin, Doctor, Patient, Nurse]"
        }
      }
    },
    date: DataTypes.DATEONLY,
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'user',
        key: 'id'
      }
    },


  }, {
    tableName: 'logs'
  });

  Log.associate = function (models) {
    Log.belongsTo(models.user, { foreignKey: 'userId' })
  }

  Log.prototype.getPublicData = function () {
    const log = this
    const publicData = _.pick(log, ['id', 'message', 'date', 'readed', 'patientId'])
    return publicData
  }

  Log.validate = function (req) {
    const schema = Joi.object({
      message: Joi.string().min(10).required(),
      readed: Joi.boolean(),
      patientId: Joi.number()
    });

    return schema.validate(req);
  }

  return Log

}