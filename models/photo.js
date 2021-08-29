const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require("joi");

module.exports = (sequelize, DataTypes) => {
    const Photo = sequelize.define('photo', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        originalname: DataTypes.STRING,
        filename: DataTypes.STRING,
        url: DataTypes.STRING,
        public_id: DataTypes.STRING,
        width: DataTypes.INTEGER,
        height: DataTypes.INTEGER,
        uploaderId: DataTypes.INTEGER,
        uploaderType: DataTypes.STRING,
        clinicId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'clinic',
                key: 'id'
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
        consultationId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'consultation',
                key: 'id'
            }
        },
        categoryId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'photoscategory',
                key: 'id'
            }
        },

    }, {
        tableName: 'photos'
    })

    Photo.associate = function (models) {
        Photo.belongsTo(models.clinic, { foreignKey: 'clinicId' })
        Photo.belongsTo(models.doctor, { foreignKey: 'doctorId' })
        Photo.belongsTo(models.patient, { foreignKey: 'patientId' })
        Photo.belongsTo(models.session, { foreignKey: 'sessionId' })
        Photo.belongsTo(models.consultation, { foreignKey: 'consultationId' })
        Photo.belongsTo(models.photoscategory, { foreignKey: 'categoryId' })


    }

    Photo.prototype.getPublicData = function () {
        let photo = this
        let publicData = _.pick(photo, ['id', 'originalname', 'url', 'categoryId'])
        return publicData
    }


    return Photo

}