'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('appointments', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            day: {
                type: Sequelize.STRING,
                validate: {
                    isIn: {
                        args: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                        msg: "Day must be a week day"
                    }
                }
            },
            date: Sequelize.DATEONLY,
            startTime: Sequelize.TIME,
            endTime: Sequelize.TIME,
            type: {
                type: Sequelize.STRING,
                validate: {
                    isIn: {
                        args: [['Check', 'Review', 'Consultation']],
                        msg: "Type must be one of the following: [Check, Review, Consultation]"
                    }
                }
            },
            description: Sequelize.STRING,
            status: {
                type: Sequelize.STRING,
                validate: {
                    isIn: {
                        args: [['Pending', 'Accepted', 'Cancelled', 'Rejected', 'Done', 'Gone']],
                        msg:  "Status must be one of the following: [Pending, Accepted, Cancelled, Rejected, Done, Gone]"
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
        return await queryInterface.dropTable('appointments');
    }
};