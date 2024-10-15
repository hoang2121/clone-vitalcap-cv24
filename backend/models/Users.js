const firebaseApp = require("../helper/firebaseApp");
const { getFirestore, deleteField, query } = require("firebase/firestore");
const { collection, doc, setDoc, getDoc, deleteDoc, updateDoc, where, getDocs } = require("firebase/firestore");
const db = getFirestore(firebaseApp);
const usersRef = collection(db, "users");

// Function to get user by email
exports.getUserByEmail = async (email) => {
    try {
        const docRef = doc(usersRef, email);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            // console.log("Document data:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("No such document!");
            return;
        }
    } catch (error) {
        console.error("Error fetching user by email: ", error);
        return { message: "Fetching user failed", error: error.message };
    }
}

// Function to get user by email
exports.getSharableUserByName = async (name) => {
    try {
        let users = [];
        const q = query(usersRef, where("email","==", name))
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            users.push(doc.data())
        });
        return users;
    } catch (error) {
        console.error("Error fetching user by Name: ", error);
        return { message: "Fetching user failed", error: error.message };
    }
}

// Function to update user by email
exports.updateUserByEmail = async (email, userData) => {
    try {
        const docRef = doc(usersRef, email);
        await updateDoc(docRef,userData);
        return { message: "Profile updated!" };
    } catch (error) {
        console.error("Error updating user: ", error);
        return { message: "Updating user failed", error: error.message };
    }
}

// Function to delete user by email
exports.deleteUserByEmail = async (email) => {
    try {
        const docRef = doc(usersRef, email);
        await deleteDoc(docRef);
        return { message: "Profile deleted!" };
    } catch (error) {
        console.error("Error deleting user: ", error);
        return { message: "Deleting user failed", error: error.message };
    }
}

// Function to delete user by email
exports.deleteUserAttributeByEmail = async (email, userData) => {
    try {
        const docRef = doc(usersRef, email);
        delete userData.email;
        for (let key in userData) {
            userData[key] = deleteField();
        }
        await updateDoc(docRef, userData);
        // await deleteDoc(docRef);
        
        
        return { message: "Profile deleted!" };
    } catch (error) {
        console.error("Error deleting user: ", error);
        return { message: "Deleting user failed", error: error.message };
    }
}

// Function to get image by name
exports.getImage = async (name) => {
    const { getStorage, ref, getDownloadURL } = require("firebase/storage");
    const storage = getStorage(firebaseApp);

    try {
        const imagesRef = ref(storage, `images/${name}`);
        const url = await getDownloadURL(imagesRef);
        return { url };
    } catch (error) {
        console.error("Error fetching image: ", error);
        return { message: "Fetching image failed", error: error.message };
    }
}

// Function to create a new user
exports.createUser = async (user) => {
    try {
        const docRef = doc(usersRef, user.email);
        await setDoc(docRef, user);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Created data:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("No such document!");
            return;
        }
    } catch (error) {
        console.error("Error creating user: ", error);
        return { message: "Creating user failed", error: error.message };
    }
}
// Function to create a new refreshToken
exports.updateRefreshToken = async (email, refreshToken) => {
    try {
        const docRef = doc(usersRef, email);
        await updateDoc(docRef, {
            refreshToken
        });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}