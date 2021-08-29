module.exports = (sequelize, DataTypes) => {
    const Calendar = sequelize.define('calendar', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        day: {
            type: DataTypes.STRING
        },
        date: {
            type: DataTypes.DATEONLY
        }
    }, {
        tableName: 'calendars'
    })

    Calendar.associate = function(models) {
        /*Clinic.hasMany(models.doctor, { foreignKey: 'clinicId' })
        Clinic.belongsTo(models.photo, { foreignKey: 'photoInfo' })*/
    }

    return Calendar

}