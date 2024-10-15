const fs = require('fs').promises;
const File = require('../models/file');
const Share = require('../models/share');
const path = require('path');
const { key } = require('../helper/HMACkey');
const crypto = require('crypto');
// const { response } = require('../server');
const { Sequelize } = require('sequelize');
const { getUsers } = require('./adminService');



const ensureDirectoryExistence = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Directory ${dir} ensured to exist.`);
    } catch (err) {
        console.error(`An error occurred while ensuring the directory ${dir}:`, err);
    }
};



async function checkFileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        } else {
            throw error;
        }
    }
}


// Create file record in the db
const createFileRecord = async (fileData) => {
    try {
        return await File.create(fileData);
    } catch (error) {
        console.error("Error creating file record:", error);
        throw new Error("Error creating file record");
    }
};

// Write file on uploads folder
const writeFileAndCheck = async (filePath, fileBuffer) => {
    try {
        if (fileBuffer instanceof ArrayBuffer) {
            fileBuffer = Buffer.from(fileBuffer);
        }
        await fs.writeFile(filePath, fileBuffer);
        return await checkFileExists(filePath);
    } catch (error) {
        console.error("Error writing file or checking existence:", error);
        throw new Error("Error writing file or checking existence");
    }
};


// The file writting controller
const handleFileUpload = async (file, newFilename, filePath, hash, timestamp, version, owners, isPublic, editor = "") => {
    try {

        const fileData = {
            filename: newFilename,
            filepath: filePath,
            hash,
            size: file.size,
            timestamp,
            version,
            owners,
            isPublic,
            deleted: false,
            editor,
            tag: newFilename
        };

        const newFile = await createFileRecord(fileData);

        if (!newFile) {
            console.log("Problem occurred during the uploading process or file name is incorrect.");
            return { message: 'Error uploading file' };
        }

        const fileWritten = await writeFileAndCheck(filePath, file.buffer);

        if (!fileWritten) {
            console.log("Problem occurred during the writing process or file name is incorrect.");
            return { message: 'Error uploading file' };
        }

        return { message: 'File uploaded successfully!', file: newFile };
    } catch (error) {
        console.error("Error handling file:", error);
        throw new Error("Error handling file");
    }
};



exports.getAllFiles = async (owner) => {
    // Check the file database and the share database to find information about files
    // that are shared with this owner with permission to edit or view,
    // not deleted, and possibly public for everyone to view
    // Return only the most recently updated files
    try {
        const filesInfo = await File.findAll({
            where: {
                // owners: owner
                [Sequelize.Op.or]: [
                    { owners: owner },
                    { isPublic: true }
                ]
            },

            // order: [['id', 'DESC']]
        });

        const shares = await Share.findAll({
            where: {
                email: owner,
            },
            order: [['id', 'DESC']]
        });


        // if (!filesInfo || filesInfo.length === 0) {
        //     return { message: 'Files not found' };
        // }

        let files = [];
        let obj = {};

        filesInfo.forEach((file) => {
            obj[`${file.filename}`] = file;
        })
        // console.log(filesInfo)
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let file = obj[key];
                let isDeleted = file.deleted
                const fileExists = await checkFileExists(file.filepath);
                let isExisted = fileExists ? true : false;
                // console.log(isExisted, !isDeleted);
                // console.log(file);
                if (isExisted && !isDeleted) {
                    // console.log(!file.isPublic, file.owners !== owner);
                    // if (file.owners !== owner && !file.isPublic) {
                    //     break;
                    // }
                    const buffer = await fs.readFile(file.filepath);
                    let fileObj = {
                        buffer,
                        filename: file.filename,
                        version: file.version,
                        size: file.size,
                        owners: file.owners,
                        createdAt: file.createdAt,
                        isPublic: file.isPublic,
                        timeStamp: file.timestamp,
                        editor: file.editor,
                        tag: file.tag,
                        filepath: file.filepath
                    };
                    files.push(fileObj);
                }
            }
        }

        const returnSharedFiles = shares.map(async (share) => {
            const fileInfo = await File.findOne({
                where: {
                    owners: share.owner,
                    filename: share.filename,
                },
                order: [['id', 'DESC']]
            });
            if (fileInfo) {
                let isDeleted = fileInfo.deleted;
                const fileExists = await checkFileExists(fileInfo.filepath);
                let isExisted = fileExists ? true : false;
                if (isExisted && !isDeleted) {
                    const buffer = await fs.readFile(fileInfo.filepath);
                    let file = {
                        buffer,
                        filename: fileInfo.filename,
                        version: fileInfo.version,
                        size: fileInfo.size,
                        owners: fileInfo.owners,
                        createdAt: fileInfo.createdAt,
                        isPublic: fileInfo.isPublic,
                        timeStamp: fileInfo.timestamp,
                        editor: fileInfo.editor,
                        tag: fileInfo.tag,
                        filepath: fileInfo.filepath
                    };
                    files.push(file);

                }
            }
        });

        await Promise.all([...returnSharedFiles]);

        if (files.length === 0) {
            return {
                message: 'Failed to get info!'
            };
        }


        //return the array of files that contains buffer -> buffer.data in fe, filename, filepath, owners: owner,editor, isPublic, timeStamp, createdAt. size, version
        return { message: 'Files got successfully!', files };
    } catch (error) {
        console.error('Error getting files', error);
        return { message: 'Error getting files', error };
    }
};

exports.getFileWithPagination = async (owner, page, limit) => {
    try {
        const files = await this.getAllFiles(owner);

        if (!files || !files.files) {
            return {
                message: 'Failed to get info!'
            };
        }

        const filesArr = files.files;
        const start = (page - 1) * limit;
        const end = start + limit;

        // Ensure start is within bounds
        if (start >= filesArr.length) {
            return {
                message: 'No more files!',
                returnedFiles: []
            };
        }

        // Get the slice of files
        const returnedFiles = filesArr.slice(start, end);

        return {
            message: 'Files retrieved successfully!',
            returnedFiles
        };

    } catch (err) {
        throw new Error(`Error getting file: ${err.message}`);
    }
};



// Allow Owner to create share data in the database with permission if it hasn't been created
// Otherwise, update the existing entry in the table
exports.sharingFile = async (filename, email, permission) => {
    try {
        const latestFile = await File.findOne({
            where: { filename },
            order: [['id', 'DESC']]
        });

        if (!latestFile) {
            return { message: "Error sharing file: can not find file" };
        }

        if (latestFile.deleted) {
            return { message: 'Error sharing file: File is deleted' };
        }

        if (latestFile.owners === email) {
            return { message: "File shared successfully!" };
        }

        const owner = latestFile.owners;


        const share = await Share.findOne({
            where: {
                filename,
                owner,
                email,
            }
        });

        if (!share) {

            const createdShare = await Share.create({
                filename,
                owner,
                email,
                permission
            });

            if (!createdShare) {
                console.log("Problem occurred during the sharing!.");
                return { message: 'Error sharing file' };
            }
        } else {
            if (permission !== "view") {
                const [affectedRows] = await Share.update({ permission },
                    {
                        where: {
                            filename,
                            owner,
                            email,
                        }
                    }
                )

                if (affectedRows === 0) {
                    console.log("Problem occurred during the sharing process or file name is incorrect.");
                    return { message: 'Error sharing file' };
                }
            }
        }



        return { message: "File shared successfully!" };

    } catch (err) {
        // throw new Error(`Error sharing files: ${err.message}`);
        return { message: `Error sharing files: ${err.message}` };
    }
}

// Allow Owner to delete all data in the shares table that contains the file name and privatize that file
exports.undoSharingFile = async (filename, email) => {
    try {

        const latestFile = await File.findOne({
            where: { filename },
            order: [['id', 'DESC']]
        });

        if (!latestFile) {
            return { message: "Error sharing file: can not find file" };
        }

        if (latestFile.owners !== email) {
            return { message: "Error sharing file: only owner is able to undo sharing this file" };
        }

        if (latestFile.deleted) {
            return { message: 'Error sharing file: File is deleted' };
        }

        const owner = latestFile.owners;

        const affectedRows = await Share.destroy({
            where: {
                filename,
                owner,
            }
        });

        // if (affectedRows === 0) {
        //     console.log("Problem occurred during the undoing sharing the file.");
        //     return { message: 'Error undoing sharing file: Problem occurred during the undoing sharing the file.' };
        // }

        await this.publicizeFile(filename, "private");

        return { message: "File undid sharing successfully!" };

    } catch (err) {
        throw new Error(`Error undo sharing files: ${err.message}`);
    }
}


// Update the `isDeleted` attribute of the data
exports.deleteFile = async (filename) => {
    try {
        const filesToDelete = await File.findAll({
            where: {
                filename
            },
            order: [['id', 'DESC']]
        });


        if (filesToDelete.length === 0) {
            return { message: 'Error deleting file: File Information is not found in the DB' };
        }

        const owner = filesToDelete[0].owners;

        const deleteFiles = filesToDelete.forEach(async (file) => {
            const checkFile = await checkFileExists(file.filepath);
            if (!checkFile) {
                return { message: 'Error deleting file: File doesnt exist in the server file system' };
            }

            await fs.unlink(file.filepath);

            const checkFileExist = await checkFileExists(file.filepath);
            if (checkFileExist) {
                return { message: 'Error deleting file!' };
            }
        })

        Promise.all([deleteFiles])


        const [affectedRows] = await File.update({ deleted: true }, {
            where: {
                filename
            },
            order: [['id', 'DESC']]
        });

        await Share.destroy({
            where: {
                filename, owner: owner
            },
            order: [['id', 'DESC']]
        });

        if (affectedRows === 0) {
            console.log("Problem occurred during the deleting process or file name is incorrect.");
            return { message: 'Error deleting file' };
        }

        return { message: 'File deleted successfully!' };

    } catch (err) {
        throw new Error(`Error deleting file: ${err.message}`);
    }
};

// Allow owner to delete file the other data 
exports.deleteFileWithAuthCheck = async (filename, email) => {
    try {


        const filesToDelete = await File.findAll({
            where: {
                filename,
                owners: email
            },
            order: [['id', 'DESC']]
        });


        if (filesToDelete.length === 0) {
            return { message: 'Error deleting file: File Information is not found in the DB or you are not the owner to delete the file' };
        }

        const owner = filesToDelete[0].owners;

        const deleteFiles = filesToDelete.forEach(async (file) => {
            const checkFile = await checkFileExists(file.filepath);
            if (!checkFile) {
                return { message: 'Error deleting file: File doesnt exist in the server file system' };
            }

            await fs.unlink(file.filepath);

            const checkFileExist = await checkFileExists(file.filepath);
            if (checkFileExist) {
                return { message: 'Error deleting file!' };
            }
        })

        Promise.all([deleteFiles])


        // const [affectedRows] = await File.update({ deleted: true }, {
        //     where: {
        //         filename
        //     },
        //     order: [['id', 'DESC']]
        // });
        
        await File.destroy({
            where: {
                filename
            },
            order: [['id', 'DESC']]
        });

        await Share.destroy({
            where: {
                filename, owner: owner
            },
            order: [['id', 'DESC']]
        });

        // console.log(affectedRows);
        // if (affectedRows === 0) {
        //     console.log("Problem occurred during the deleting process or file name is incorrect.");
        //     return { message: 'Error deleting file' };
        // }

        return { message: 'File deleted successfully!' };

    } catch (err) {
        throw new Error(`Error deleting file: ${err.message}`);
    }
};


// Check the Share database and File database, and permision to allow user to update files, file records
exports.updateFile = async (file, updateName, editor) => {
    // console.log(owner, editor)
    const lockFilePath = path.join(__dirname, '../uploads', `${updateName}.lock`);
    let lockAcquired = null;

    try {
        // Acquire a lock by creating a lock file
        lockAcquired = await fs.open(lockFilePath, 'wx').catch(() => false);

        if (!lockAcquired) {
            return { message: 'Error updating file: another update is in progress. Please try again later.' };
        }

        // Format file's name
        const timestamp = Date.now();
        const fileName = file.originalname.split(".")[0];
        const type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        const newFilename = `${fileName}-${timestamp}.${type}`;

        // Create directory to store file
        const filePath = path.join(__dirname, '../uploads', updateName);
        const existFileinStorage = await checkFileExists(filePath);
        const fileUpdatePath = path.join(__dirname, '../uploads', newFilename);
        const dir = path.dirname(filePath);
        await ensureDirectoryExistence(dir);

        // console.log(editor, owner, updateName)
        const existFileinDB = await File.findOne({ where: { filename: updateName }, order: [['id', 'DESC']] });

        const owner = existFileinDB.owners;

        const sharable = await Share.findOne({
            where: {
                email: editor,
                owner: owner,
                filename: updateName,
            }
        });

        // console.log(sharable)



        if (!existFileinStorage) {
            return { message: 'Error updating file: the file doesnt exist in the Server File System!' };
        }

        const shareExist = sharable ? true : false;
        // const fileExist = existFileinDB ? true : false;

        const sharedEditorPermission = (shareExist === true && sharable.permission === "edit");

        if (existFileinDB.owners !== editor && !sharedEditorPermission) {
            return { message: "Error updating file: user lacks permissions to update this file" };
        }

        const updatedVersion = existFileinDB.version ? existFileinDB.version + 1 : 2;
        const hash = await crypto.createHmac('sha256', key).update(file.buffer).digest('hex');

        await fs.writeFile(fileUpdatePath, file.buffer);
        const checkWrite = await checkFileExists(fileUpdatePath);
        if (!checkWrite) {
            return { message: 'Error updating file: File write failed' };
        }

        const response = await handleFileUpload(file, updateName, fileUpdatePath, hash, timestamp, updatedVersion, existFileinDB.owners, false, editor);

        if (response) {
            const privacy = existFileinDB.isPublic ? "public" : "private";
            await this.publicizeFile(updateName, privacy);
        }
        if (!response.file){
            return { message: "Error updating file: Cant write updated file" };
        }
        // console.log(response.file)

        // let { file } = response

        return { message: 'File updated successfully!', file: response.file };

    } catch (error) {
        console.error("Error updating file:", error);
        return { message: "Error updating file" };
    } finally {
        // Remove the lock file
        try {
            if (lockAcquired) {
                await lockAcquired.close();
                await fs.unlink(lockFilePath);
            }
        } catch (err) {
            console.error("Error removing lock file:", err);
        }
    }
};

// Update isPublic attributes in File record to let users access the document to view (Reused from File Service version 1)
exports.publicizeFile = async (filename, privacy) => {
    try {
        let message;
        let isPublic;

        if (privacy === "public") {
            isPublic = true;
            message = 'File publicized successfully!';
        } else if (privacy === "private") {
            isPublic = false;
            message = 'File privatized successfully!';
        } else {
            return { message: 'Invalid privacy setting' };
        }
        // check if file exists
        let file = await File.findOne({
            where: { filename },
            order: [['id', 'DESC']]
        });

        if (!file) {
            return { message: 'Error publicizing file: file doesn\'t exist in the database or you are not the owner of the file' };
        }

        let fileExist = checkFileExists(file.filepath);

        if (!fileExist) {
            return { message: 'Error publicizing file: file doesn\'t exist in the system' };
        }

        await File.update({ isPublic }, {
            where: { filename }
        });

        return { message };

    } catch (err) {
        throw new Error(`Error publicizing files: ${err.message}`);
    }
};

// Allow Owner to update isPublic attributes in File record to let users share their files with all
exports.shareFileToAll = async (filename, email = "", permission = "view") => {
    try {
        // Check if the file exists and if the current account's email is the owner
        const file = await File.findOne({
            where: { filename, owners: email },
            order: [['id', 'DESC']]
        });

        if (!file) {
            return { message: "Error sharing file to all: file doesn't exist in the database or you are not the owner of the file" };
        }

        const fileExist = checkFileExists(file.filepath);
        if (!fileExist) {
            return { message: "Error sharing file to all: file doesn't exist in the system" };
        }

        // Fetch existing shares
        const existingShares = await Share.findAll({
            where: { filename, owner: email }
        });

        // Create a Set for fast lookup
        const existingEmails = new Set(existingShares.map(share => share.email));

        // If the user wants to share the file with "edit" permission for all users in the Firestore User database,
        // create a Share record for each user. Do not change the isPublic attribute to "true" (public) to avoid
        // duplicating images/files when the frontend calls getFiles. The frontend logic handles fetching files that
        // are either owned by the current email account, public with "view" permission, or shared with "edit/view" permissions.
        if (permission === "edit") {
            // If sharing with "edit" permission, create Share records for all users in the Firestore User database
            const users = await getUsers();

          

            // Filter out users who already have a share record
            const usersToShareWith = users.filter(user => user.email && !existingEmails.has(user.email));

            // Create new Share records
            if (usersToShareWith.length > 0) {
                await Promise.all(usersToShareWith.map(user => {
                    return Share.create({
                        filename,
                        owner: email,
                        email: user.email,
                        permission
                    });
                }));
            }

            // Update the file's isPublic attribute to "private" to avoid duplication errors in getFiles
            await this.publicizeFile(filename, "private");

        } else {
            // If sharing with "view" permission, make the file public
            await this.publicizeFile(filename, "public");
        }

        return { message: "File shared to all successfully!" };

    } catch (err) {
        throw new Error(`Error sharing file to all: ${err.message}`);
    }
};


// Upload the file
exports.uploadFile = async (file, owner) => {
    try {


        // Reformat the file name 
        const timestamp = Date.now();
        const fileName = file.originalname.split(".")[0];
        const type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        const newFilename = `${fileName}-${timestamp}.${type}`;
        const filePath = path.join(__dirname, '../uploads', newFilename);
        const dir = path.dirname(filePath);

        // Check if the folder exists and create it if it doesn't
        await ensureDirectoryExistence(dir);

        // Create a hashed version of the file content for later verification
        const hash = await crypto.createHmac('sha256', key).update(file.buffer).digest('hex');

        // Retrieve file data from the database
        const duplicateFile = await File.findOne({
            where: { hash, owners: owner },
            order: [['id', 'DESC']],
        });


        // Upload data to the database if no existing data for that file is found
        if (!duplicateFile) {
            return await handleFileUpload(file, newFilename, filePath, hash, timestamp, 1, owner, false);
        } else {
            // Check if the file exists locally on the disk
            const checkExistFile = await checkFileExists(duplicateFile.filepath);

            if (!checkExistFile) {
                // If the file does not exist locally, create a new file info record and write the file to the disk
                return await handleFileUpload(file, newFilename, filePath, hash, timestamp, 1, owner, false);
            } else {

            }

            // If the file exists, only update the timestamp in the file record
            const [affectedRows] = await File.update(
                { timestamp },
                {
                    where: { hash },
                    order: [['id', 'DESC']]
                }
            );

            // console.log(affectedRows)

            if (affectedRows === 0) {
                console.log("Update Record: Problem occurred during the uploading process or file name is incorrect.");
                return { message: 'Error uploading file' };
            }

            return { message: 'File uploaded successfully' }
        }



    } catch (error) {
        console.error("Error uploading file:", error);
        return { message: "Error uploading file" };
    }
};

// This function allows changing the tag name associated with a file to avoid issues when renaming the file.
// The tag functions as a nickname, separate from the physical filename, and can be changed at any time.
// Initially, the tag is set to be the same as the physical filename during the file's creation or upload.
exports.changeTagName = async (filename, email, tag) => {
    try {


        // If the file exists, only update the tag Name in the file record
        const [affectedRows] = await File.update(
            { tag },
            {
                where: { filename, owners: email }
            }
        );
        
        if (affectedRows === 0) {
            console.log("Update Record: Problem occurred during the tag changing process or file name is incorrect.");
            return { message: 'Error tag changing' };
        }
        

        return { message: 'Tag Name changed successfully' }
    } catch (error) {
        console.error("Error changing Tag Name:", error);
        return { message: "Error changing Tag Name: Cant found file or you are not allowed to change the tag name!" };
    }

}