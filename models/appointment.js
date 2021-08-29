const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const Appointment = sequelize.define('appointment', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        day: {
            type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                    msg: "Day must be a week day"
                }
            }
        },
        date: DataTypes.DATEONLY,
        startTime: DataTypes.TIME,
        endTime: DataTypes.TIME,
        type: {
            type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [['Check', 'Review', 'Consultation']],
                    msg: "Type must be one of the following: [Check, Review, Consultation]"
                }
            }
        },
        description: DataTypes.STRING,
        status: {
            type: DataTypes.STRING,
            validate: {
                isIn: {
                    args: [['Pending', 'Accepted', 'Cancelled', 'Rejected', 'Done', 'Gone']],
                    msg: "Status must be one of the following: [Pending, Accepted, Cancelled, Rejected, Done, Gone]"
                }
            }
        },
        doctorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'doctor',
                key: 'id'
            }
        },
        patientId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'patient',
                key: 'id'
            }
        },
        sessionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'session',
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
        tableName: 'appointments'
    });

    Appointment.associate = function (models) {
        Appointment.belongsTo(models.doctor, { foreignKey: 'doctorId' })
        Appointment.belongsTo(models.patient, { foreignKey: 'patientId' })
        Appointment.belongsTo(models.session, { foreignKey: 'sessionId' })
        Appointment.belongsTo(models.clinic, { foreignKey: 'clinicId' })

    }

    Appointment.prototype.getPublicProfile = function () {
        const appointment = this
        const publicData = _.pick(appointment, ['id', 'day', 'date', 'startTime',
            'endTime', 'type', 'description', 'status', 'doctorId', 'patientId', 'sessionId', 'clinicId'])
        return publicData
    }

    Appointment.validate = function (req) {
        let schema = Joi.object({
            day: Joi.string().min(3).required(),
            date: Joi.date().required(),
            startTime: Joi.string().required(),
            endTime: Joi.string().required(),
            type: Joi.string().min(3).required(),
            description: Joi.string().min(10).required(),
            status: Joi.string().min(3).required(),
            doctorId: Joi.number().required(),
            patientId: Joi.number(),
            sessionId: Joi.number(),
            clinicId: Joi.number().required()
        });

        return schema.validate(req);
    }

    return Appointment

}