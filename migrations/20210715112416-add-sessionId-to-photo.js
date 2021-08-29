'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('photos', 'sessionId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'sessions',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('photos', "sessionId")
  }
};
