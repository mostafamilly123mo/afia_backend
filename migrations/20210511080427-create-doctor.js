'use strict';
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.createTable('doctors', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            firstName: Sequelize.STRING,
            lastName: Sequelize.STRING,
            phoneNumber: Sequelize.INTEGER,
            description: Sequelize.STRING,
            sepecialize: Sequelize.STRING,
            language: Sequelize.STRING,
            status: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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
    down: async(queryInterface, Sequelize) => {
        return await queryInterface.dropTable('doctors');
    }
};