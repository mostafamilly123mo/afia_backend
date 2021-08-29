'use strict';
module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.createTable('workingdays', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            day: {
                type: Sequelize.STRING
            },
            date: {
                type: Sequelize.DATEONLY
            },
            startTime: Sequelize.TIME,
            endTime: Sequelize.TIME,
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
        return await queryInterface.dropTable('workingdays');
    }
};