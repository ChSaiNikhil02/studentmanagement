// models/student.js
module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define(
    "Student",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      rollNumber: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      course: { type: DataTypes.STRING(150), allowNull: false },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { isInt: true, min: 1, max: 4 },
      },
    },
    {
      tableName: "Students",
    }
  );

  return Student;
};
