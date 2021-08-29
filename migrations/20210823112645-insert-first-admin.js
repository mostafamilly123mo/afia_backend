'use strict';
const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    queryInterface.bulkInsert('users' ,[{
      email : "mostafamilly6@gmail.com",
      password : await bcrypt.hash("12345678", 8),
      username : "mostafakmilly",
      type : "Admin",
      createdAt: new Date(),
      updatedAt: new Date()
    }])
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.bulkDelete('users' , {
      username : "mostafakmilly"
    })
  }
};