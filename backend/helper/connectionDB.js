const { Sequelize } = require('sequelize');
// Load dotenv if not already loaded
require('dotenv').config();

// Parse environment variables
const {
    DB_NAME,
    DB_USER,
    DB_HOST,
    DB_DIALECT
} = process.env;

// Read DB_PASSWORD from environment variables
const dbPassword = process.env.DB_PASSWORD === 'null' ? null : process.env.DB_PASSWORD;

// Initialize Sequelize with database connection details
// Configre Sequelize to connect and map with data in the MySQL database
const sequelize = new Sequelize(DB_NAME, DB_USER, dbPassword, {
    host: DB_HOST,
    dialect: DB_DIALECT,
    logging: false, // Disable logging SQL queries
});

/**
 * Asynchronous function to authenticate the database connection.
 * Logs success or error messages to the console.
 */
const connectionDB = async () => {
    try {
        
        await sequelize.authenticate();
        console.log('Connection has been established successfully.' + DB_HOST);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

// // Immediately invoke the connection function to establish the database connection
// (async () => {
//     await connectionDB();
// })();

// Export the sequelize instance and the connectionDB function for external use
module.exports = { sequelize, connectionDB };
