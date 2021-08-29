//Packages
const _ = require('lodash')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isEmail: true,
                isEmailUnique: function (email) {
                    return User.findOne({ where: { email } })
                        .then((result) => {
                            if (result) {
                                throw new Error('Email already in use!');
                            }
                        })
                }
            },
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isUsernameUnique(username) {
                    return User.findOne({ where: { username } })
                        .then((result) => {
                            if (result) {
                                throw new Error('Username already in use!');
                            }
                        })
                }
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [['Admin', 'Doctor', 'Patient', 'Nurse']],
                    msg: "Type must be one of the following: [Admin, Doctor, Patient, Nurse]"
                }
            }
        }
    }, {
        tableName: 'users'
    })

    User.associate = function (models) {
        User.hasOne(models.doctor, { foreignKey: 'userId' })
        User.hasOne(models.patient, { foreignKey: 'userId' })
        User.hasMany(models.log, { foreignKey: 'userId' })
    }

    User.addHook('beforeCreate', async function (user) {
        if (user.changed('password'))
            user.password = await bcrypt.hash(user.password, 8)
    })

    User.addHook('beforeUpdate', async function (user) {
        if (user.changed('password'))
            user.password = await bcrypt.hash(user.password, 8)
    })

    User.prototype.getPublicProfile = function () {
        const user = this
        const publicData = _.pick(user, ['id', 'email', 'username', 'type'])
        return publicData
    }

    User.generateAuthJWT = function (user) {
        const token = jwt.sign({ id: user.id, username: user.username, type: user.type }, 'clinic')
        return token
    }

    User.prototype.ckeckUsernameIsValid = async function (username) {
        let user = await User.findOne({ where: { username } })
        if (user) throw new Error('This all ready taken')
        else
            return true
    }

    User.findByCredentials = async (username, password) => {
        const user = await User.findOne({
            where: { username }
        })

        if (!user) {
            throw new Error('Unable to login.....!')
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            throw new Error('Email or password invalid....')
        }

        return user
    }

    User.validate = function (user) {

        const schema = Joi.object({
            email: Joi.string().email().required(),
            username: Joi.string().min(5).max(20).required(),
            password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            type: Joi.string().required()
        });
        return schema.validate(user);
    }

    return User

}

