'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('photos', 'consultationId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'consultations',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('photos', "consultationId")
  }
};
