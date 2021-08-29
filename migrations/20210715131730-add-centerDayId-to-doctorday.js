'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('doctordays', 'centerDayId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'centerdays',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('doctordays', "centerDayId")
  }
};
