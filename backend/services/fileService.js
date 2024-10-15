// const firebaseApp = require("../helper/firebaseApp");
// const { getStorage, ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } = require("firebase/storage");
// const storage = getStorage(firebaseApp);
// const https = require('https');
// const fs = require('fs');
// const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const File = require('../models/file');
const { where } = require('sequelize');
const { version } = require('os');
const { key } = require('../helper/HMACkey');
const { timeStamp } = require('console');
const { Sequelize } = require('sequelize');


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

// create file record in the db
const createFileRecord = async (fileData) => {
    try {
        return await File.create(fileData);
    } catch (error) {
        console.error("Error creating file record:", error);
        throw new Error("Error creating file record");
    }
};

// write file on disk
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


// call function write file on disk and create data in the db
const handleFileUpload = async (file, newFilename, filePath, hash, timestamp, version, owners, isPublic) => {
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
            editor: owners
        };

        const newFile = await createFileRecord(fileData);

        if (!newFile) {
            console.log("File Record Error: Problem occurred during the uploading process or file name is incorrect.");
            return { message: 'Error uploading file' };
        }

        const fileWritten = await writeFileAndCheck(filePath, file.buffer);

        if (!fileWritten) {
            console.log("Write File Error: Problem occurred during the writing process or file name is incorrect.");
            return { message: 'Error uploading file' };
        }

        return { message: 'File uploaded successfully!', file: newFile };
    } catch (error) {
        console.error("Error handling file:", error);
        throw new Error("Error handling file");
    }
};

//v.02
exports.uploadFile = async (file, owner) => {
    try {


        // format the file name 
        const timestamp = Date.now();
        const fileName = file.originalname.split(".")[0];
        const type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        const newFilename = `${fileName}-${timestamp}.${type}`;
        const filePath = path.join(__dirname, '../uploads', newFilename);
        const dir = path.dirname(filePath);

        // check and created folder if it doesnt exist
        await ensureDirectoryExistence(dir);

        // create a hashed version of file content for latter check
        const hash = await crypto.createHmac('sha256', key).update(file.buffer).digest('hex');

        // file data of file in the db
        const duplicateFile = await File.findOne({
            where: { hash, owners: owner },
            order: [['id', 'DESC']],
        });


        // upload data to the db id there is no found data for that file found in the db
        if (!duplicateFile) {
            return await handleFileUpload(file, newFilename, filePath, hash, timestamp, 1, owner, false);
        } else {
            // check if that file exists locally on the disk
            const checkExistFile = await checkFileExists(duplicateFile.filepath);

            if (!checkExistFile) {
                // if file not exist locally, we will create both new file info record and write file on the disk
                return await handleFileUpload(file, newFilename, filePath, hash, timestamp, 1, owner, false);
            }else{
                
            }

            // if it exists, we only update the timestamp in the file record
            const [affectedRows] = await File.update(
                { timestamp },
                {
                    where: { hash },
                    order: [['id', 'DESC']]
                }
            );

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


exports.updateFile = async (file, updateName, owner) => {
    try {
        const timestamp = Date.now();
        const fileName = file.originalname.split(".")[0];
        const type = file.originalname.split(".")[file.originalname.split(".").length - 1];
        const newFilename = `${fileName}-${timestamp}.${type}`;
        const existFileinDB = await File.findOne({ where: { filename: updateName }, order: [['id', 'DESC']] });

        const filePath = path.join(__dirname, '../uploads', updateName);
        const existFileinStorage = await checkFileExists(filePath);
        const fileUpdatePath = path.join(__dirname, '../uploads', newFilename);
        const dir = path.dirname(filePath);
        await ensureDirectoryExistence(dir);


        if (!existFileinStorage) {
            return { message: 'Error updating file' };
        }

        if (!existFileinDB) {
            return { message: 'Error updating file' };
        }

        console.log(existFileinDB.isPublic)

        if (existFileinDB.owners !== owner && !existFileinDB.isPublic) {
            return { message: "Error updating file: the file is not public" };
        }


        const updatedVersion = existFileinDB.version ? existFileinDB.version + 1 : 2;
        const hash = await crypto.createHmac('sha256', key).update(file.buffer).digest('hex');
        const duplicateFile = await File.findOne({ where: { hash, filename: updateName } });


        if (duplicateFile) {
            const [affectedRows] = await File.update(
                { timestamp },
                { where: { id: existFileinDB.id, hash } }
            );

            if (affectedRows === 0) {
                console.log("Problem occurred during the updating process or file name is incorrect.");
                return { message: 'Error updating file' };
            }
            return { message: 'File updated successfully!' };
        }

        await fs.writeFile(fileUpdatePath, file.buffer);
        const checkWrite = await checkFileExists(fileUpdatePath);
        if (!checkWrite) {
            return { message: 'Error updating file: File write failed' };
        }

        await handleFileUpload(file, updateName, fileUpdatePath, hash, timestamp, updatedVersion, existFileinDB.owners, existFileinDB.isPublic);

        return { message: 'File updated successfully!' };

    } catch (error) {
        console.error("Error updating file:", error);
        return { message: "Error updating file" };
    }
};





exports.deleteFile = async (filename, version, owner) => {
    try {
        // Retrieve file details from database
        if (version === "latest") {
            const latestFile = await File.findOne({
                where: { filename, owners: owner },
                order: [['id', 'DESC']]
            });
            version = latestFile ? latestFile.version : version;
        }
        const fileToDelete = await File.findOne({
            where: {
                filename,
                version,
                owners: owner
            }
        });
        if (!fileToDelete) {
            return { message: 'File not found' };
        }


        const checkFile = await checkFileExists(fileToDelete.filepath);
        if (!checkFile) {
            return { message: 'Error deleting file' };
        }


        await fs.unlink(fileToDelete.filepath);

        const checkFileExist = await checkFileExists(fileToDelete.filepath);
        if (checkFileExist) {
            return { message: 'Error deleting file' };
        }

        // Delete file record from database
        const [affectedRows] = await File.update({ deleted: true }, {
            where: {
                filename, version: version, owners: owner
            }
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



exports.getFile = async (filename, version, owner) => {
    try {
        // Retrieve file details from database
        if (version === "latest") {
            const latestFile = await File.findOne({
                where: { filename, owners: owner },
                order: [['id', 'DESC']]
            });
            version = latestFile ? latestFile.version : version;
        }


        const fileToDownload = await File.findOne({
            where: {
                filename,
                version,
                owners: owner
            }
        });
        // console.log(fileToDownload);
        if (!fileToDownload) {
            // console.log("File not found")
            return { message: 'File not found' };
        }


        const checkFileExist = await checkFileExists(fileToDownload.dataValues.filepath);
        // console.log(fileToDownload.dataValues.filepath)
        if (!checkFileExist) {
            console.log("File not found");
            return { message: 'File not found' };
        }

        const fileBuffer = await fs.readFile(fileToDownload.filepath);

        if (!fileBuffer) {
            return { message: 'Error getting file' };
        }

        const file = {
            buffer: fileBuffer,
            filename: fileToDownload.filename,
            version: fileToDownload.version,
            timeStamp: fileToDownload.timestamp
        }

        return { message: 'File got successfully!', file };

    } catch (err) {
        throw new Error(`Error getting file: ${err.message}`);
    }
};




exports.getFileInfo = async (filename, version, owner) => {
    if (version === "latest") {
        const latestFile = await File.findOne({
            where: { filename, owners: owner },
            order: [['id', 'DESC']]
        });
        version = latestFile ? latestFile.version : version;
    }

    const fileToDownload = await File.findOne({
        where: {
            filename,
            version,
            owners: owner
        },
        order: [['id', 'DESC']]
    });

    if (!fileToDownload) {
        return { message: 'File not found' };
    }


    const checkFileExist = await checkFileExists(fileToDownload.filepath);
    if (!checkFileExist) {
        return { message: 'File not found' };
    }

    const file = {
        filename: fileToDownload.filename,
        version: fileToDownload.version,
        size: fileToDownload.size,
        owners: fileToDownload.owners,
        createdAt: fileToDownload.createdAt,
        isPublic: fileToDownload.isPublic,
        timeStamp: fileToDownload.timestamp
    }

    return { message: 'File info got successfully!', file };

}



exports.getAllFiles = async (owner) => {
    try {
        const filesInfo = await File.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { owners: owner },
                    { isPublic: true }
                ]
            },
            order: [['id', 'DESC']]
        });

        if (!filesInfo || filesInfo.length === 0) {
            return { message: 'Files not found' };
        }

        let files = [];

        await Promise.all(filesInfo.map(async (info) => {
            if (info.filepath) {
                const fileExists = await checkFileExists(info.filepath);
                if (fileExists) {
                    const buffer = await fs.readFile(info.filepath);

                    let file = {
                        buffer,
                        filename: info.filename,
                        version: info.version,
                        size: info.size,
                        owners: info.owners,
                        createdAt: info.createdAt,
                        isPublic: info.isPublic,
                        timeStamp: info.timestamp
                    };
                    files.push(file);
                }
            }
        }));

        if (files.length === 0) {
            return {
                message: 'Failed to get info!'
            };
        }

        return { message: 'Files got successfully!', files };
    } catch (error) {
        console.error('Error getting files', error);
        return { message: 'Error getting files', error };
    }
};





exports.publicizeFile = async (filename, version, owner, privacy) => {
    try {
        if (version === "latest") {
            const latestFile = await File.findOne({
                where: { filename, owners: owner },
                order: [['version', 'DESC']]
            });
            version = latestFile ? latestFile.version : version;
        }


        let isPublic;
        if (privacy === "public") {
            isPublic = true;
            message = 'File publicized successfully!';
        }
        else if (privacy === "private") {
            isPublic = false;
            message = 'File privatized successfully!';
        }
        else {
            return { message: 'Invalid privacy setting' };
        }




        const [affectedRows] = await File.update({ isPublic: isPublic }, {
            where: {
                filename, version, owners: owner,
            }
        });

        // console.log(version, filename, owner, privacy, affectedRows)

        if (affectedRows === 0) {
            console.log("Problem occurred during the publicize file or file name is incorrect.");
            return { message: 'Error publicizing file' };
        }
        return { message };

    } catch (err) {
        throw new Error(`Error publicizing files: ${err.message}`);
    }
}

