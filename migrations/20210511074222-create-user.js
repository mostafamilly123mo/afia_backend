'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            email: {
                type: Sequelize.STRING,
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
                type: Sequelize.STRING,
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
                type: Sequelize.STRING,
                allowNull: false
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                validate: {
                    isIn: {
                        args: [['Admin', 'Doctor', 'Patient', 'Nurse']],
                        msg: "Type must be one of the following: [Admin, Doctor, Patient, Nurse]"
                    }
                }
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        return await queryInterface.dropTable('users');
    }
};