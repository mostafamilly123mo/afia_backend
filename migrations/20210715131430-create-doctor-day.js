'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('doctordays', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            day: {
                type: Sequelize.STRING,
                allowNull: false,
                validate: {
                    isIn: {
                        args: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                        msg: "Day must be a week day"
                    }
                }
            },
            startTime: Sequelize.TIME,
            endTime: Sequelize.TIME,
            inWork: {
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
    down: async (queryInterface, Sequelize) => {
        return await queryInterface.dropTable('doctordays');
    }
};