'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return await queryInterface.createTable('centerdays', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true
            },
            day: {
                type: Sequelize.STRING,
                allowNull: false,
                validate: {
                    isIn: {
                        args: [['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']],
                        msg: "Day must be a week day"
                    },
                    isDayUnique(day) {
                        return CenterDay.findOne({ where: { day } })
                            .then((result) => {
                                if (result) {
                                    throw new Error('This day already has open time and close time!');
                                }
                            })
                    }
                }

            },
            openTime: Sequelize.TIME,
            closeTime: Sequelize.TIME,
            isOpen: {
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
        return await queryInterface.dropTable('centerdays');
    }
};