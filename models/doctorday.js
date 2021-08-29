
const _ = require('lodash')
const Joi = require("joi");


module.exports = (sequelize, DataTypes) => {
    const DoctorDay = sequelize.define('doctorday', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        day: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                    msg: "Day must be a week day"
                },

            }
        },
        startTime: DataTypes.TIME,
        endTime: DataTypes.TIME,
        inWork: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        doctorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'doctor',
                key: 'id'
            }
        },
        centerDayId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'centerday',
                key: 'id'
            }
        },

    }, {
        tableName: 'doctordays'
    })

    DoctorDay.associate = function (models) {
        DoctorDay.belongsTo(models.doctor, { foreignKey: 'doctorId' })
        DoctorDay.belongsTo(models.centerday, { foreignKey: 'centerDayId' })
    }

    DoctorDay.prototype.getPublicData = function () {
        const day = this
        const publicData = _.pick(day, ['id', 'day', 'startTime', 'endTime',
            'doctorId', 'centerDayId'])
        return publicData
    }

    DoctorDay.validate = function (req) {
        const schema = Joi.object({
            day: Joi.string().required(),
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
            inWork: Joi.boolean(),
            doctorId: Joi.number().required()
        });
        return schema.validate(req);
    }

    return DoctorDay

}

//.pattern(new RegExp('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'))