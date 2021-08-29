
const _ = require('lodash')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define('session', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        medicine: DataTypes.STRING,
        doctorReport: DataTypes.STRING
    }, {
        tableName: 'sessions'
    })

    Session.associate = function (models) {
        Session.hasOne(models.appointment, { foreignKey: 'sessionId' })
        Session.hasMany(models.photo, { foreignKey: 'sessionId' })

    }

    Session.prototype.getPublicData = function () {
        let session = this
        let publicData = _.pick(session, ['id', 'medicine', 'doctorReport'])
        return publicData
    }

    Session.validate = function (req) {
        const schema = Joi.object({
            medicine: Joi.string(),
            doctorReport: Joi.string(),
        });
        return schema.validate(req);
    }

    return Session

}