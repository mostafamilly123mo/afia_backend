const _ = require('lodash')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const CenterDay = sequelize.define('centerday', {
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
                isDayUnique(day) {
                    return CenterDay.findOne({ where: { day } })
                        .then((result) => {
                            if (result) {
                                throw new Error('This day already has open time and close time!');
                            }
                        })
                }
            }
        },
        openTime: DataTypes.TIME,
        closeTime: DataTypes.TIME,
        isOpen: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'centerdays'
    })

    CenterDay.associate = function (models) {
        CenterDay.hasMany(models.doctorday, { foreignKey: 'centerDayId' })
    }

    CenterDay.prototype.getPublicData = function () {
        let day = this
        let publicData = _.pick(day, ['id', 'day', 'openTime', 'closeTime'])
        return publicData
    }

    CenterDay.validate = function (req) {
        const schema = Joi.object({
            day: Joi.string().required(),
            openTime: Joi.string().required(),
            closeTime: Joi.string().required(),
            isOpen: Joi.boolean()
        });
        return schema.validate(req);
    }

    return CenterDay

}