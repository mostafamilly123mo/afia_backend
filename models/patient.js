//Packages
const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi');

module.exports = (sequelize, DataTypes) => {
    const Patient = sequelize.define('patient', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        firstName: DataTypes.STRING,
        middleName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        address: DataTypes.STRING,
        phone: DataTypes.STRING,
        number: DataTypes.STRING,
        gender: DataTypes.STRING,
        length: DataTypes.FLOAT,
        weight: DataTypes.FLOAT,
        birthday: DataTypes.DATEONLY,
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        }
    }, {
        tableName: 'patients'
    })

    Patient.associate = function (models) {
        Patient.belongsTo(models.user, { foreignKey: 'userId' })
        Patient.hasMany(models.appointment, { foreignKey: 'patientId' })
        Patient.hasMany(models.consultation, { foreignKey: 'patientId' })
        Patient.hasOne(models.photo, { foreignKey: 'patientId' })
        Patient.hasMany(models.review, { foreignKey: 'patientId' })
    }

    Patient.prototype.getPublicProfile = function () {
        const patient = this
        const publicData = _.pick(patient, ['id', 'firstName', 'middleName', 'lastName', 'address', 'phone', 'number',
            'gender', 'length', 'weight', 'birthday'])
        return publicData
    }

    Patient.validate = function (req) {
        let schema = Joi.object({
            firstName: Joi.string().min(3).required(),
            middleName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            address: Joi.string().min(8).required(),
            phone: Joi.number().min(9).required(),
            number: Joi.number().min(6).required(),
            gender: Joi.string().min(4).required(),
            length: Joi.number().max(220).required(),
            weight: Joi.number().max(300).required(),
            birthday: Joi.date().required(),
            user: Joi.required()
        });

        return schema.validate(req);
    }
    
    return Patient

}