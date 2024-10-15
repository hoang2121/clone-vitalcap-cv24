const jwt = require("jsonwebtoken");
const promisify = require("util").promisify;

// Promisify jwt.sign and jwt.verify to use async/await
const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);
const Users = require("../models/Users");

/**
 * Generates a JSON Web Token (JWT) for a given payload.
 *
 * @param {Object} dataForToken - The payload to include in the token.
 * @param {string} accesTokenSecret - The secret key used to sign the token.
 * @param {number|string} accesTokenLife - The token's lifespan (default is 2 seconds).
 * @returns {Promise<string|null>} - The signed JWT or null if an error occurs.
 */
exports.generateToken = async (dataForToken, accesTokenSecret, accesTokenLife = 2) => {
    try {
        return await sign(
            { payload: dataForToken },
            accesTokenSecret,
            {
                algorithm: "HS256",
                expiresIn: accesTokenLife
            }
        );
    } catch (err) {
        console.error("Error generating token:", err);
        return null;
    }
};

/**
 * Decodes a JWT without verifying its expiration.
 *
 * @param {string} token - The JWT to decode.
 * @param {string} secretKey - The secret key used to verify the token.
 * @returns {Promise<Object|null>} - The decoded token payload or null if an error occurs.
 */
exports.decodeToken = async (token, secretKey) => {
    try {
        return await verify(token, secretKey, {
            ignoreExpiration: true
        });
    } catch (err) {
        console.error("Error decoding token:", err);
        return null;
    }
};

/**
 * Verifies the validity of a JWT.
 *
 * @param {string} token - The JWT to verify.
 * @param {string} secretKey - The secret key used to verify the token.
 * @returns {Promise<Object|null>} - The decoded token payload if valid, or null if invalid.
 */
exports.verifyToken = async (token, secretKey) => {
    try {
        return await verify(token, secretKey);
    } catch (err) {
        console.error("Error verifying token:", err);
        return null;
    }
};
