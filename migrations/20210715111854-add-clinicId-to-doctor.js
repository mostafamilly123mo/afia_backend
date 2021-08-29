'use strict';

module.exports = {
    up: async(queryInterface, Sequelize) => {
        return await queryInterface.addColumn('doctors', 'clinicId', {
            type: Sequelize.INTEGER,
            references: {
                model: 'clinics',
                key: 'id'
            }
        })
    },

    down: async(queryInterface, Sequelize) => {
        return await queryInterface.removeColumn('doctors', "clinicId")
    }
};