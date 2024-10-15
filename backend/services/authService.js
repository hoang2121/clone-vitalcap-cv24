const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, updatePassword, sendPasswordResetEmail, getMultiFactorResolver } = require("firebase/auth");
const firebaseApp = require("../helper/firebaseApp");
const { getFirestore } = require("firebase/firestore");
const { collection, doc, setDoc, getDoc, deleteDoc, updateDoc } = require("firebase/firestore");
const jwt = require("jsonwebtoken");
const authFApp = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const usersRef = collection(db, "users");
const Users = require("../models/Users");
const bcrypt = require("bcrypt");
const authMethod = require("../helper/authMethod");
const randToken = require("rand-token");
const authConfig = require("../helper/authConfig");

const admin = require("firebase-admin");
const { updateProfile } = require("./profileService");






exports.login = async (userData) => {
    const { email, password } = userData;
    try {
        // Sign in to get data in Authentication using the Firebase instance, email, and password
        const userCredential = await signInWithEmailAndPassword(authFApp, email, password);
        const user = userCredential.user.providerData[0];
        console.log("Login successful with this authentication account: " + user.email);

        // Check user data in the current Firestore
        const people = await Users.getUserByEmail(email);

        if (!people) {
            console.log(people)
            return { message: "Unable to find account" };
        }

        // Decrypt and check the password retrieved from the database
        const isPasswordValid = bcrypt.compareSync(password, people.password);
        if (!isPasswordValid) {
            // console.log(isPasswordValid)
            if(!userCredential){
                return { message: "Invalid Password" };
            }
            // Check and update both user database data and authentication data after they reset their email
            const hashPassword = bcrypt.hashSync(password, 10);
            await updateProfile({ email, password: hashPassword, isResetPassword: false });
        }
        // TO DO: use singleton to initialize accessTokenSecret for the whole application
        // TO DO: use singleton to initialize accessTokenLife for the whole application
        const accessTokenLife = authConfig.accessTokenLife;
        const accessTokenSecret = authConfig.accessTokenSecret;

        const dataForToken = {
            email,
        }

        // Generate new token
        const accessToken = await authMethod.generateToken(
            dataForToken,
            accessTokenSecret,
            accessTokenLife
        );

        if (!accessToken) {
            return { message: "Unable to generate token" };
        }

        // add the mechanism to automatically generate refresh or something?
        // add the mechanism to use the refresh to generate the new one
        let refreshToken = randToken.generate(50);
        if (!people.refreshToken) {
            // console.log(people.refreshToken)
            // update new toekn inside the db
            await Users.updateRefreshToken(email, refreshToken);
        } else {
            refreshToken = people.refreshToken;
        }
        // console.log(people.refreshToken)

        return {
            message: "Login Successfully!",
            accessToken,
            refreshToken: refreshToken,
            user: {
                email: people.email
            }
        }



    } catch (error) {
        console.error("Error during login: ", error);
        if (error.message === "Firebase: Error (auth/missing-email).") {
            return { message: "Missing email" }
        }
        else if (error.message === "Firebase: Error (auth/missing-password).") {
            return { message: "Missing password" }
        }
        else if (error.message === "Firebase: Error (auth/invalid-credential).") {
            return { message: "Invalid Credentials" }
        }
        else {
            return { message: "Login failed", error: error.message };
        }
    }
}

exports.signup = async (userData) => {
    const { email, password, firstName = "", lastName = ""} = userData;
    try {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(authFApp, email, password);
        const user = userCredential.user.providerData[0];
        console.log("Created a new authentication account: " + user.email);

        // await setDoc(doc(usersRef, user.email), {
        //     email: user.email
        // });

        // Retrieve user data from the database
        const people = await Users.getUserByEmail(email);

        if (!people) {
            // Create new user data, hash the new password, and store it in the database if the user is not found
            const hashPassword = bcrypt.hashSync(password, 10);
            const newUser = {
                email,
                password: hashPassword,
                firstName: firstName,
                lastName: lastName
            }
            const createUser = await Users.createUser(newUser);
            if (!createUser) {
                return { message: "Error while creating new account!" };
            } else {
                return { message: "Signup successfully", email: createUser.email };
            }
        }

        return { message: "Signup successful", email: user.email };
    } catch (error) {
        console.error("Error during signup: ", error);
        if (error.message === "Firebase: Error (auth/email-already-in-use).") {
            // If only the data in the database is lost, catch the error 
            // from the Firebase Authentication create method, then add the new data to the collection
            const people = await Users.getUserByEmail(email);
            if (people) {
                return { message: "Email already in use" };
            } else {
                const hashPassword = bcrypt.hashSync(password, 10);
                const newUser = {
                    email,
                    password: hashPassword
                }
                const createUser = await Users.createUser(newUser);
                return { message: "Signup successfully", email: createUser.email };
            }

        }
        else {
            return { message: "Signup failed", error: error.message };
        }
    }
}

exports.changePassword = async (userData) => {
    const { email, password, newPassword } = userData;
    // console.log(email,password, newPassword)
    try {
        const userCredential = await signInWithEmailAndPassword(authFApp, email, password);
        // console.log(userCredential)
        if(!userCredential){
            return { message: "Wrong Password, Failed to change password!" };
        }
        // console.log(userCredential)
        // const user = authFApp.currentUser;

        // await updatePassword(user, newPassword);

        const userRecord = await admin.auth().getUserByEmail(email);
        if(!userRecord){
            return { message: "Failed to change password!" };
        }
        // console.log(userRecord.password)
        // if(userRecord.password !== password){
        //     return { message: "Wrong Password, Failed to change password!" };
        // }

        // Update user data in Authentication using the Admin SDK
        const uid = userRecord.uid;
        // console.log(uid)
        await admin.auth().updateUser(uid, {
            password: newPassword,
        });

        // Hash new data with bcrypt before storing it in the database
        const hashNewPassword = bcrypt.hashSync(newPassword, 10);
        const newUser = {
            password: hashNewPassword
        }

        // Update user data in the database
        const result = await Users.updateUserByEmail(email, newUser);
        if (result.message !== "Profile updated!"){
            return { message: "Failed to change password!" };
        }


        return { message: "Changed password successfully!" };
    } catch (error) {
        console.error("Error during password changing: ", error);
        return { message: "Error during password changing", error: error.message };
    }
}
exports.resetPassword = async (email) => {
    try {
        // Call the method to send an email, then reset the data
        const userRecord = await admin.auth().getUserByEmail(email);
        if (!userRecord) {
            return { message: "User account does not exist" };
        }
        
        
        await sendPasswordResetEmail(authFApp,email);
        await updateProfile({email, isResetPassword: true});
        return({message: "Send reset password message successfully!"});
    } catch (error) {
        console.error("Error during sending reset email: ", error);
        return { message: "Error during sending reset email", error: error.message };
    }
}

exports.deleteAuth = async (userData) => {
    const { email, password } = userData;
    try {
        // Retrieve user data
        const userCredential = await signInWithEmailAndPassword(authFApp, email, password);
        if (!userCredential) {
            return { message: "Wrong Password, Failed to delete auth!" };
        }
        // const user = authFApp.currentUser;

        // const res = await deleteUser(user);


        // if (!res) {
        //     return { message: "Failed to delete User" };
        // }

        const userRecord = await admin.auth().getUserByEmail(email);
        if (!userRecord) {
            return { message: "Failed to delete user" };
        }

        const uid = userRecord.uid;

        // Delete user data in the firebase's authentication
        await admin.auth().deleteUser(uid);

      
        // Delete user in the database
        const result = await Users.deleteUserByEmail(email);
        if (result.message !== "Profile deleted!") {
            return { message: "Failed to delete user" };
        }


        return { message: "Deleted user successfully!" };
    } catch (error) {
        console.error("Error during deleting user: ", error);
        return { message: "Error during deleting user", error: error.message };
    }
}