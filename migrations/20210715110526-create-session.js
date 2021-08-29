'use strict';
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.createTable('sessions', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            medicine: Sequelize.STRING,
            doctorReport: Sequelize.STRING,
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
    down: async(queryInterface, Sequelize) => {
        return await queryInterface.dropTable('sessions');
    }
};