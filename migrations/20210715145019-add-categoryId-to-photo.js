'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.addColumn('photos', 'categoryId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'photoscategories',
        key: 'id'
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.removeColumn('photos', "categoryId")
  }
};