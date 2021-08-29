
const _ = require('lodash')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const Clinic = sequelize.define('clinic', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING
    }, {
        tableName: 'clinics'
    })

    Clinic.associate = function (models) {
        Clinic.hasMany(models.doctor, { foreignKey: 'clinicId' })
        Clinic.hasOne(models.photo, { foreignKey: 'clinicId' })
        Clinic.hasOne(models.appointment, { foreignKey: 'clinicId' })
        Clinic.hasOne(models.consultation, { foreignKey: 'clinicId' })
    }

    Clinic.prototype.getPublicData = function () {
        let clinic = this
        let publicData = _.pick(clinic, ['id', 'name'])
        return publicData
    }

    Clinic.validate = function (req) {
        const schema = Joi.object({
            name: Joi.string().required()
        });
        return schema.validate(req);
    }

    return Clinic

}