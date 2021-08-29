'use strict';
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.createTable('patients', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            firstName: Sequelize.STRING,
            middleName: Sequelize.STRING,
            lastName: Sequelize.STRING,
            address: Sequelize.STRING,
            phone: Sequelize.STRING,
            number: Sequelize.STRING,
            gender: Sequelize.STRING,
            length: Sequelize.FLOAT,
            weight: Sequelize.FLOAT,
            birthday: Sequelize.DATEONLY,
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
        return await queryInterface.dropTable('patients');
    }
};