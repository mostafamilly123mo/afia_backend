
const _ = require('lodash')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const DHoliday = sequelize.define('doctorholiday', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        day: {
            type: DataTypes.STRING
        },
        date: {
            type: DataTypes.DATEONLY
        },
        doctorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'doctors',
                key: 'id'
            }
        }
    }, {
        tableName: 'doctorholidays'
    })

    DHoliday.associate = function(models) {
        DHoliday.belongsTo(models.doctor, { foreignKey: 'doctorId' })
            /*Clinic.hasMany(models.doctor, { foreignKey: 'clinicId' })
            Clinic.belongsTo(models.photo, { foreignKey: 'photoInfo' })*/
    }

    DHoliday.prototype.getPublicData = function() {
        let holiday = this
        let publicData = _.pick(holiday, ['id', 'day', 'date', 'doctorId'])
        return publicData
    }

    DHoliday.validate = function (req) {
        const schema = Joi.object({
            day: Joi.string().required(),
            date: Joi.date().required(),
            doctorId: Joi.number().required()
        });
        return schema.validate(req);
    }

    return DHoliday

}