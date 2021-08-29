const Sequelize = require('sequelize')

const sequelize = new Sequelize('clinic', 'root', 'root', {
    dialect: 'mysql',
    host: 'localhost'
});


module.exports = sequelize;