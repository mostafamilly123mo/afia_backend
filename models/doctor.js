//Packages
const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi');

module.exports = (sequelize, DataTypes) => {
    const Doctor = sequelize.define('doctor', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        phoneNumber: DataTypes.INTEGER,
        description: DataTypes.STRING,
        sepecialize: DataTypes.STRING,
        language: DataTypes.STRING,
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        clinicId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'clinic',
                key: 'id'
            }
        }
    }, {
        tableName: 'doctors'
    })

    Doctor.associate = function (models) {
        Doctor.belongsTo(models.clinic, { foreignKey: 'clinicId' })
        Doctor.belongsTo(models.user, { foreignKey: 'userId' })
        Doctor.hasMany(models.appointment, { foreignKey: 'doctorId' })
        Doctor.hasMany(models.consultation, { foreignKey: 'doctorId' })
        Doctor.hasOne(models.photo, { foreignKey: 'doctorId' })
        Doctor.hasMany(models.doctorday, { foreignKey: 'doctorId' })
        Doctor.hasMany(models.doctorholiday, { foreignKey: 'doctorId' })
        Doctor.hasMany(models.workingday, { foreignKey: 'doctorId' })
        Doctor.hasOne(models.tag, { foreignKey: 'doctorId' })
    }

    Doctor.prototype.getPublicProfile = function () {
        const doctor = this
        const publicData = _.pick(doctor, ['id', 'firstName', 'lastName', 'phoneNumber',
            'description', 'sepecialize', 'language', 'clinicId'])
        return publicData
    }

    Doctor.validate = function (req) {
        let schema = Joi.object({
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            phoneNumber: Joi.number().min(9).required(),
            description: Joi.string().min(20).required(),
            sepecialize: Joi.string().min(4).required(),
            language: Joi.string().min(5).required(),
            clinicId: Joi.number(),
            user: Joi.required()

        });

        return schema.validate(req);
    }


    return Doctor

}