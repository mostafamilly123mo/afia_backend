module.exports = (sequelize, DataTypes) => {
    const WorkingDay = sequelize.define('workingday', {
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
        },
        startTime: DataTypes.TIME,
        endTime: DataTypes.TIME,
        doctorId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'doctors',
                key: 'id'
            }
        }
    }, {
        tableName: 'workingdays'
    })

    WorkingDay.associate = function(models) {
        /*Clinic.hasMany(models.doctor, { foreignKey: 'clinicId' })*/
        WorkingDay.belongsTo(models.doctor, { foreignKey: 'doctorId' })
    }

    return WorkingDay

}