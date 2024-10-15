// Load dotenv if not already loaded
require('dotenv').config();

// Parse the CREDENTIALS and CONFIG environment variables
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

// Config credentials of google vision
const config = {
    credentials: {
        private_key: CREDENTIALS.private_key,
        client_email: CREDENTIALS.client_email
    }
}

const credentials = {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email
}

module.exports = {credentials, config};