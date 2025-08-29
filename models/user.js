// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    username: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { len: [3, 50] } },
    passwordHash: { type: DataTypes.STRING, allowNull: false }
  }, { tableName: "Users" });

  return User;
};
