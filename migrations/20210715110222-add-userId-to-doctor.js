'use strict';

module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.addColumn('doctors', 'userId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'users',
                key: 'id'
            }
        })
    },

    down: async(queryInterface, Sequelize) => {
        return await queryInterface.removeColumn('doctors', "userId")
    }
};