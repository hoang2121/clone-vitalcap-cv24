/**
 * Middleware function to handle errors thrown by other middleware or route handlers.
 * Logs the error and sends an appropriate error response to the client.
 * @param {Error} err - The error object passed from previous middleware or route handler.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
exports.errorHandling = (err, req, res, next) => {
    console.error("Error while handling middleware:", err); // Log the error for debugging purposes
    res.status(500).send("Error while processing your request."); // Send a generic error response to the client
};
