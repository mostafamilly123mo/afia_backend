
const _ = require('lodash')
const Joi = require("joi");


module.exports = (sequelize, DataTypes) => {
    const CHoliday = sequelize.define('centerholiday', {
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
        }
    }, {
        tableName: 'centerholidays'
    })

    CHoliday.associate = function (models) {
        //CHoliday.belongsTo(models.doctor, { foreignKey: 'doctorId' })
        /*Clinic.hasMany(models.doctor, { foreignKey: 'clinicId' })
        Clinic.belongsTo(models.photo, { foreignKey: 'photoInfo' })*/
    }

    CHoliday.prototype.getPublicData = function () {
        let holiday = this
        let publicData = _.pick(holiday, ['id', 'day', 'date'])
        return publicData
    }
    
    CHoliday.validate = function (req) {
        const schema = Joi.object({
            day: Joi.string().required(),
            date: Joi.date().required()
        });
        return schema.validate(req);
    }

    return CHoliday

}