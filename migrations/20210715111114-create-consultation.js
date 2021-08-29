'use strict';

const { date } = require("joi");

module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('consultations', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            question: Sequelize.STRING,
            questionDate: Sequelize.DATEONLY,
            answer: Sequelize.STRING,
            answerDate: Sequelize.DATEONLY,
            status: {
                type: Sequelize.STRING,
                defaultValue: 'Pending'
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
        return await queryInterface.dropTable('consultations');
    }
};