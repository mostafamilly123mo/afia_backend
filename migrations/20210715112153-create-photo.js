'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('photos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            originalname: Sequelize.STRING,
            filename: Sequelize.STRING,
            url: Sequelize.STRING,
            public_id: Sequelize.STRING,
            width:Sequelize.INTEGER,
            height:Sequelize.INTEGER,
            uploaderId: Sequelize.INTEGER,
            uploaderType: Sequelize.STRING,
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
        return await queryInterface.dropTable('photos');
    }
};