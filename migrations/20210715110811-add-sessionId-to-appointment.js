'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('appointments', 'sessionId', {
      type: Sequelize.INTEGER,
      references: {
          model: 'sessions',
          key: 'id'
      }
  })  
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('appointments', "sessionId")

  }
};
