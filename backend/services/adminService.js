const firebaseApp = require("../helper/firebaseApp");
const { collection, doc, getDocs, deleteDoc, updateDoc, getFirestore } = require("firebase/firestore");
const admin = require("firebase-admin");
// const serviceAccount = require("../serviceAccountKey.json"); // Path to the JSON file

// Initialize Firestore
const db = getFirestore(firebaseApp);
// Reference to the users collection in the Firebase database
const usersRef = collection(db, "users");

const serviceAccount = JSON.parse(process.env.SERVICEACCOUNTKEY || '{}');

// Initialize Firebase Admin SDK with service account
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://demovital-90d7f-default-rtdb.asia-southeast1.firebasedatabase.app"
});

exports.getUsers = async () => {
    try {
        const querySnapshot = await getDocs(usersRef);
        const userData = [];

        // Push data to the users collection
        querySnapshot.forEach((doc) => {
            userData.push(doc.data());
        });

        return userData;
    } catch (error) {
        console.error("Error getting users:", error);
        throw new Error("Failed to get users");
    }
};

exports.modifyUser = async (userData) => {
    try {
        const docRef = doc(usersRef, userData.email);

        // Update data in the users collection based on the reference
        await updateDoc(docRef, userData);
        return { message: "User updated successfully!" };
    } catch (error) {
        console.error("Error updating user:", error);
        throw new Error("Failed to update user");
    }
};

exports.deleteUser = async (userData) => {
    try {
        // Reference to the user's document in Firestore
        const docRef = doc(usersRef, userData.email);

        // Delete the user's document from Firestore
        await deleteDoc(docRef);

        // Fetch the user's data from Firebase Authentication using the Admin SDK
        const user = await admin.auth().getUserByEmail(userData.email);

        // Delete the user from Firebase Authentication
        await admin.auth().deleteUser(user.uid);

        return { message: "User deleted successfully!" };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user");
    }
};

exports.deleteAllUsers = async (userData) => {
    try {

        let users = [];
        users = await this.getUsers();
        await Promise.all(
            users.map(async (userData) => {
                this.deleteUser(userData)
            })
        )
        return { message: "Users deleted successfully!" };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user");
    }
};

// Function to get user by email
exports.getUserByEmail = async (email) => {
    try {
        // Use the Firebase Admin SDK with an integrated API key for permission
        // Instead of using the signIn method to retrieve data
        // To access user data in Authentication while adhering to Firebase security rules
        const user = await admin.auth().getUserByEmail(email);
        console.log('User retrieved successfully:', user);
        return user;
    } catch (error) {
        console.error('Error getting user by email:', error);
        throw new Error('Failed to get user by email');
    }
};
