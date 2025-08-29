// models/index.js
const { Sequelize, DataTypes } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const DB_NAME = process.env.DB_NAME || "studentDB";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "your_mysql_password";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.User = require("./user")(sequelize, DataTypes);
db.Student = require("./student")(sequelize, DataTypes);

// Through table: UserStudents (prevents duplicate associations by index)
db.UserStudents = sequelize.define(
  "UserStudents",
  {},
  {
    tableName: "UserStudents",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["userId", "studentId"],
      },
    ],
  }
);

// Many-to-many
db.User.belongsToMany(db.Student, {
  through: db.UserStudents,
  foreignKey: "userId",
  otherKey: "studentId",
});
db.Student.belongsToMany(db.User, {
  through: db.UserStudents,
  foreignKey: "studentId",
  otherKey: "userId",
});

module.exports = db;
