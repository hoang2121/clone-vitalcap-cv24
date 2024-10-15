const authConfig = require("../helper/authConfig");
const authMethod = require("../helper/authMethod");
const Users = require("../models/Users");

/**
 * Middleware function to check if user is authenticated.
 * Verifies the access token in the request header.
 * Adds user information to req.user if authenticated.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
exports.isAuth = async (req, res, next) => {
    let accessTokenFromHeader = req.headers.authorization;

    // Check if access token exists in the request header
    if (!accessTokenFromHeader) {
        return res.status(401).send("Access token not found.");
    }

    // // Use a more robust method to extract the token (e.g., splitting by space)
    // const tokenParts = accessTokenFromHeader.split(" ");
    // if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    //     return res.status(401).json({ message: "Invalid token format" });
    // }

    // accessToken = tokenParts[1];


    // Initialize access token secret from configuration
    const accessTokenSecret = authConfig.accessTokenSecret;

    // Verify the access token using the verifyToken method
    // const verified = await authMethod.verifyToken(accessToken, accessTokenSecret);
    const verified = await authMethod.verifyToken(accessTokenFromHeader, accessTokenSecret);

    // If token verification fails, return unauthorized status
    if (!verified) {
        return res.status(401).send("Unauthorized: Access token invalid.");
    }

    // Check token expiry
    const tokenExpiryDate = new Date(verified.exp * 1000);
    const currentTime = new Date();

    if (tokenExpiryDate < currentTime) {
        return res.status(401).send("Access token expired. Please refresh your token.");
    }

    // Fetch user details based on email from the token payload
    // const user = await Users.getUserByEmail(verified.payload.email);
    // console.log(verified)
    // const user = await Users.getUserByEmail(verified.email);
    // Add user information to req.user for further processing
    // req.user = user;
    // => check the role, etc.

    return next();
};
