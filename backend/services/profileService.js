const firebaseApp = require("../helper/firebaseApp");
const { collection, doc, getDoc, deleteDoc, updateDoc, getFirestore, deleteField } = require("firebase/firestore");
// const db = getFirestore(firebaseApp);
// const usersRef = collection(db, "users");
const Users = require("../models/Users");
const { getAllFiles, uploadFile, updateFile, deleteFile, deleteFileWithAuthCheck } = require("./fileServiceV2");
const { log } = require("winston");
const { profile } = require("console");
const fs = require('fs').promises;
exports.getProfile = async (userData) => {
    try {
        // console.log(userData)
        let { email } = userData;
        // const docRef = doc(usersRef, userData.email);
        // const docSnap = await getDoc(docRef);
        // get user data in the firebase db
        const user = await Users.getUserByEmail(email);
        if (user) {
            console.log(user);
            return { message: "Profile found!", data: user };

            // console.log("Document data:", docSnap.data());
            // const data = docSnap.data();
            // console.log(data)
            // if (data.name !== undefined && data.age !== undefined) {
            //     return { message: "Profile found!", data: { email: userData.email, name: data.name, age: data.age } };
            // } else {
            //     console.log("No such document with complete data!");
            //     return { message: "No such document with complete data!" };
            // }
        } else {
            console.log("No such document!");
            return { message: "No such document!" };
        }
    } catch (error) {
        console.error("Error getting profile:", error);
        throw new Error("Failed to get profile");
    }
}

exports.getSharableProfile = async (name) => {
    try {
        const users = await Users.getSharableUserByName(name);
        if (users) {
            console.log(users);
            return { message: "Profile found!", data: users };
        } else {
            console.log("No such document!");
            return { message: "No such document!" };
        }
    } catch (error) {
        console.error("Error getting profile:", error);
        throw new Error("Failed to get profile");
    }
}

exports.updateProfile = async (userData) => {
    try {
        // take email out of userData obj that contains many other attributes
        let { email } = userData
        // const docRef = doc(usersRef, userData.email);
        // const updatedProfile = {};

        // // Only include fields that are defined
        // if (userData.name !== undefined) {
        //     updatedProfile.name = userData.name;
        // }
        // if (userData.age !== undefined) {
        //     updatedProfile.age = userData.age;
        // }

        // await updateDoc(docRef, updatedProfile);
        // update user data in the firebase db
        await Users.updateUserByEmail(email, userData);
        return { message: "Profile updated!" };
    } catch (error) {
        console.error("Error updating profile:", error);
        throw new Error("Failed to update profile");
    }
}

exports.deleteProfile = async (userData) => {
    try {
        // console.log(userData)
        let { email } = userData;
        // const docRef = doc(usersRef, userData.email);
        // await updateDoc(docRef, {
        //     name: deleteField(),
        //     age: deleteField()
        // });
        // Optionally delete the document if needed
        // await deleteDoc(docRef);
        // await Users.deleteUserByEmail(email);
        // delete user data in the firebase db
        await Users.deleteUserAttributeByEmail(email, userData)
        return { message: "Profile deleted!" };
    } catch (error) {
        console.error("Error deleting profile:", error);
        throw new Error("Failed to delete profile");
    }
}





// Allow owner to delete file the other data 
exports.deleteAvatar = async (email) => {
    try {
        let profile = await this.getProfile({email});
        let {avatarName} = profile.data;

        if(!avatarName){
            return { message: "Error updated avatar: cant found avatar on the system" };
        }

        // console.log(avatarName)

        // upload avatar file
        const response = await deleteFileWithAuthCheck(avatarName,email);

        if (!response.message.includes("File deleted successfully!")) {
            return { message: "Error updated avatar: failed to delete avatar file on system" };
        }
       
        let res = await this.updateProfile({
            email,
            avatarFilePath: "",
            avatarName: ""
        })

        if (!res) {
            return { message: "Error uploading avatar: failed to delete avatar's attrubutes from db" };
        }


        return { message: 'Avatar deleted successfully!' };

    } catch (err) {
        throw new Error(`Error deleting avatar: ${err.message}`);
    }
};


// Permision to allow user to update files, file records
exports.updateAvatar = async (file, email) => {
    try {
        // change name of avatar
        let type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        let fileName = file.originalname.split(".")[0];
        fileName = "Avatar";
        file.originalname = `${fileName}.${type}`;
        // console.log(file.originalname);

        // get avatar file info
        let profile = await this.getProfile({ email})
        let { avatarName, avatarFilePath } = profile.data;
        // console.log(avatarName)
        if(!avatarName || !avatarFilePath){
            return { message: "Error updating avatar: not found avatar file on system" };
        }
        // update avatar file
        const response = await updateFile(file,avatarName,email);
        if (!response.message.includes("File updated successfully!")) {
            return { message: "Error updating avatar: failed to write avatar file on system" };
        }

        avatarName = response.file.filename;
        avatarFilePath = response.file.filepath;

        let res = await this.updateProfile({
            email,
            avatarFilePath,
            avatarName
        })

        if (!res) {
            return { message: "Error uploading avatar: failed to add avatar to db" };
        }

        return { message: 'Avatar updated successfully!' };

    } catch (error) {
        console.error("Error updating avatar:", error);
        return { message: "Error updating avatar" };
    } 
};

// get the avatar owned by email
exports.getAvatar = async (email) => {
    try {
        // get avatar file info
        let profile = await this.getProfile({ email: email });

        if (!profile) {
            return { message: "Error getting avatar: profile not found" };
        }
        let { avatarFilePath, avatarName } = profile.data;

        if (!avatarFilePath || !avatarName){
            return { message: "Error getting avatar: not found avatarFilePath or Avatar Name" };
        }
        
        console.log(avatarFilePath)
        // read and return the buffer
        let buffer = await fs.readFile(avatarFilePath);
        let avatar = {
            avatarFilePath,
            avatarName,
            buffer
        }


        return { message: 'Avatar got successfully!', avatar };
    } catch (error) {
        console.error('Error getting files', error);
        return { message: 'Error getting files', error };
    }
};

// Upload the file
exports.uploadAvatar = async (file, email) => {
    try {
        // change name of avatar
        let type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        let fileName = file.originalname.split(".")[0];
        fileName = "Avatar";
        file.originalname = `${fileName}.${type}`;
        // console.log(file.originalname);

        const res = await this.getProfile({ email: email });
        if (res.message === "No such document!") {
            return { message: "Error uploading avatar: Cant find Profile!" };
        }

        // upload avatar file
        const response = await uploadFile(file, email);
        if (!response.message.includes("File uploaded successfully")){
            return { message: "Error uploading avatar: failed to write avatar file on system" };
        }

        // console.log(response)

        // update avatar url attribute in firebase db
        if (response.message === "File uploaded successfully!") {
            const res = await this.updateProfile({
                avatarFilePath: response.file.filepath,
                avatarName: response.file.filename,
                email: email
            })
            if(!res){
                return { message: "Error uploading avatar: failed to add avatar to db" };
            }
        }

        return { message: "Avatar uploaded successfully!"}



    } catch (error) {
        console.error("Error uploading avatar:", error);
        return { message: "Error uploading avatar" };
    }
};
