const app = require('./index');
const { connectionDB } = require('./helper/connectionDB');
const initializeGrpc = require('./grpcServer');

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        // Open connection with DB via the sequelize
        await connectionDB();
        console.log('Database connected successfully');

        // Start the express server
        const server = app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT}.`);
        });

        // Start a Grpc Server
        await initializeGrpc();
        return server;
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

// Check the current module to ensure that is the main module
if (require.main === module) {
    startServer();
}
// startServer();

module.exports = { app, startServer };

