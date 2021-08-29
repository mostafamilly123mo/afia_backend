'use strict';
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.createTable('clinics', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            name: Sequelize.STRING,
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
        return await queryInterface.dropTable('clinics');
    }
};