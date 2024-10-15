// Load dotenv if not already loaded
require('dotenv').config();

class AuthConfig {
    constructor() {
        // Check if an instance already exists
        if (!AuthConfig.instance) {
            // Set the access token life duration
            this.accessTokenLife = process.env.ACCESS_TOKEN_LIFE || "30m";
            // Set the secret key for signing access tokens from environment variable or default to a safe value
            this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
            // Store the instance in a static property
            AuthConfig.instance = this;
        }
        // Return the single instance of the class
        return AuthConfig.instance;
    }
}

// Export a single instance of AuthConfig
module.exports = new AuthConfig();
