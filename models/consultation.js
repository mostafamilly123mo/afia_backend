//Packages
const _ = require('lodash')
const Joi = require('joi')

module.exports = (sequelize, DataTypes) => {
    const Consultation = sequelize.define('consultation', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        question: DataTypes.STRING,
        questionDate: DataTypes.DATEONLY,
        answer: DataTypes.STRING,
        answerDate: DataTypes.DATEONLY,
        status: {
            type: DataTypes.STRING,
            defaultValue: 'Pending'
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
        clinicId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'clinic',
                key: 'id'
            }
        }

    }, {
        tableName: 'consultations'
    });

    Consultation.associate = function (models) {
        Consultation.belongsTo(models.doctor, { foreignKey: 'doctorId' })
        Consultation.belongsTo(models.patient, { foreignKey: 'patientId' })
        Consultation.hasMany(models.photo, { foreignKey: 'consultationId' })
        Consultation.belongsTo(models.clinic, { foreignKey: 'clinicId' })

    }

    Consultation.prototype.getPublicData = function () {
        const consultation = this
        const publicData = _.pick(consultation, ['id', 'question', 'questionDate', 'answer', 'answerDate',
            'status', 'clinicId', 'doctorId', 'patientId'])
        return publicData
    }

    Consultation.validate = function (req) {

        const schema = Joi.object({
            date: Joi.date(),
            question: Joi.string().min(10).required(),
            questionDate: Joi.date(),
            answer: Joi.string().min(10),
            answerDate: Joi.date(),
            doctorId: Joi.number().required(),
            patientId: Joi.number(),
            clinicId: Joi.number().required(),
        });

        return schema.validate(req);
    }

    return Consultation

}