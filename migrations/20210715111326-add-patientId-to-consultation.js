'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('consultations', 'patientId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'patients',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('consultations', "patientId")

  }
};
