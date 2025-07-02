const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,    
  process.env.DB_USER,     
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false, 
  }
);


const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected via Sequelize.");

    // Sync models
    await sequelize.sync({ alter: true });
    console.log("✅ Models synced.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
