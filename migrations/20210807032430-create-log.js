'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      message: Sequelize.TEXT,
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [['Admin', 'Doctor', 'Patient', 'Nurse']],
            msg: "Type must be one of the following: [Admin, Doctor, Patient, Nurse]"
          }
        }
      },
      date: Sequelize.DATEONLY,
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
    await queryInterface.dropTable('logs');
  }
};