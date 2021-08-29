'use strict';


module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('reviews', 'patientId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'patients',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('reviews', "patientId")
  }
};
