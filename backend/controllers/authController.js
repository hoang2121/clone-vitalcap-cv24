const authService = require("../services/authService");
const authMethod = require("../helper/authMethod");
const Users = require("../models/Users");
const authConfig = require("../helper/authConfig");

// Function to handle user signup
exports.signup = async (req, res) => {
    try {
        const userData = req.body;
        if (!userData) {
            // Check if request body is empty
            return res.status(400).json({ message: "Error: Can't signup, no user data provided" });
        }
        
        const response = await authService.signup(userData);
        if(response.message === "Email already in use"){
            return res.status(401).json({message: "Email already in use" })
        }else {
            res.status(200).json(response);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to handle user login
exports.login = async (req, res) => {
    try {
        const data = req.body;
        if (!data) {
            // Check if request body is empty
            return res.status(400).json({ message: "Error: Can't login, no login data provided" });
        }
        const response = await authService.login(data);
        if (response.message === "Invalid Credentials") {
            return res.status(401).json({ message: "Invalid Credentials" });
        }
        else if (response.message === "Missing password"){
            return res.status(401).json({message: "Missing password"})
        }
        else if (response.message === "Missing email"){
            return res.status(401).json({message: "Missing email"})
        }
        if (response.user) {
            // If login is successful
            res.status(200).json(response);
        } else {
            // If user not found
            res.status(404).json(response);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Function to handle refresh token generation
exports.refreshToken = async (req, res) => {
    try {
        let accessTokenFromHeader = req.headers.authorization;

        if (!accessTokenFromHeader) {
            return res.status(400).json({ message: "Can't find access token" });
        }

        const tokenParts = accessTokenFromHeader.split(" ");
        if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
            return res.status(401).json({ message: "Invalid token format" });
        }
        accessTokenFromHeader = tokenParts[1];


        // Extract refresh token from request body
        const refreshTokenFromBody = req.body.refreshToken;
        if (!refreshTokenFromBody) {
            return res.status(400).json({ message: "Can't find refresh token" });
        }

        // Use singleton to initialize accessTokenSecret and accessTokenLife for the whole application
        const accessTokenLife = authConfig.accessTokenLife;
        const accessTokenSecret = authConfig.accessTokenSecret;

        // Decode the access token
        const decoded = await authMethod.decodeToken(
            accessTokenFromHeader,
            accessTokenSecret
        );
        // console.log(decoded)
        if (!decoded) {
            return res.status(400).json({ message: "Invalid access token" });
        }

        const userEmail = decoded.payload.email;
        const user = await Users.getUserByEmail(userEmail);
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        if (refreshTokenFromBody !== user.refreshToken) {
            return res.status(400).json({ message: "Invalid refresh token" });
        }

        const dataForToken = {
            email: userEmail
        };

        // Generate new access token
        const accessToken = await authMethod.generateToken(
            dataForToken,
            accessTokenSecret,
            accessTokenLife
        );

        if (!accessToken) {
            return res.status(400).json({ message: "Can't create token" });
        }

        // Send back new access token 
        return res.json({
            accessToken
        });

    } catch (error) {
        console.error("Error generating refresh token:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



exports.changePassword = async (req, res) => {
    try{
        const {email, password, newPassword} = req.body;

        if (!email || !password || !newPassword) {
            // Check if request body is empty
            return res.status(400).json({ message: "Error: Email, newPassword, and password are required" }); // Check if required fields are provided
        }

        let data = {
            email, password, newPassword
        }
        const response = await authService.changePassword(data);
        if (response.message === "Changed password successfully!"){
            return res.status(200).json({ message: response.message });
        }else{
            return res.status(403).json({ message:  response.message });
        }
    }catch(err){
        console.error("Error changing password:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

exports.resetPassword = async (req, res) => {
    try {
        const { email} = req.body;

        if (!email) {
            // Check if request body is empty
            return res.status(400).json({ message: "Error: Email is required" }); // Check if required fields are provided
        }

        const response = await authService.resetPassword(email);
        if (response.message === "Send reset password message successfully!") {
            return res.status(200).json(response);
        } else {
            return res.status(403).json(response);
        }
    } catch (err) {
        console.error("Error reseting password:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

exports.deleteAuth = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            // Check if request body is empty
            return res.status(400).json({ message: "Error: Email, and password are required" }); // Check if required fields are provided
        }
        let data = {
            email, password
        }
        const response = await authService.deleteAuth(data);
        if (response.message === "Deleted user successfully!") {
            return res.status(200).json({ message: response.message });
        } else {
            return res.status(403).json({ message: response.message });
        }

    } catch (err) {
        console.error("Error generating refresh token:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}