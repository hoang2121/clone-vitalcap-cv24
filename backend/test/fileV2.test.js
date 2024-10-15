const request = require("supertest");
const app = require("../index");
const path = require('path');
const fs = require('fs').promises;
const File = require('../models/file');
const Share = require('../models/share');
const crypto = require('crypto');
const { key } = require('../helper/HMACkey');
const { updateFile, sharingFile, deleteFile, getAllFiles, undoSharingFile, uploadFile } = require('../services/fileServiceV2');
// const { uploadFile } = require('../services/fileService');
const { where } = require("sequelize");

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

async function ensureDirectoryExistence(uploadDir) {
    try {
        await fs.access(uploadDir);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(uploadDir, { recursive: true });
        } else {
            throw error;
        }
    }
}

async function delFiles(uploadDir) {
    try {
        const files = await fs.readdir(uploadDir);
        await Promise.all(files.map(async (file) => {
            // console.log(file)
            let mockName = file.split("-")[0];
            if (mockName === "Mockfile") {
                await fs.unlink(path.join(uploadDir, file));
            }
        }));
    } catch (error) {
        console.error('An error occurred during cleanup:', error);
    }
}

async function delFilesInfo(data) {
    try {
        await File.destroy({ where: data });
    } catch (error) {
        console.error('An error occurred during cleanup:', error);
    }
}

async function delSharesInfo(data) {
    try {
        await Share.destroy({ where: data });
    } catch (error) {
        console.error('An error occurred during cleanup:', error);
    }
}

async function createTheFile(fileName, suffix, owner) {
    try {
        let file = {};
        file.originalname = fileName;
        file.buffer = Buffer.from('This is a test file' + suffix);
        // let buffer = file.buffer;
        const res = await uploadFile(file, owner);

        return res;

    } catch (error) {
        console.error("Error creating file:", error);
    }
}

async function findFileInfoOnContent(content, owner) {
    try {
        let buffer = Buffer.from(content);
        let hash = await crypto.createHmac('sha256', key).update(buffer).digest('hex');
        // console.log(hash)
        const file = await File.findOne({ where: { owners: owner, hash }, order: [["id", "DESC"]] });
        // console.log(file)
        return file;
    } catch (error) {
        console.error("Error during the info finding: " + error)
    }
}

describe("File Service", () => {
    const uploadDir = path.join(__dirname, '../uploads');

    beforeAll(async () => {
        // Ensure upload directory exists
        try {
            await ensureDirectoryExistence(uploadDir);
        } catch (error) {
            console.error("Error in beforeAll:", error);
        }
    });

    beforeEach(async () => {
        try {
            await delFiles(uploadDir);
        } catch (err) {
            console.error(err);
        }
    });

    afterEach(async () => {
        try {
            jest.clearAllMocks();
        } catch (error) {
            console.error("Error in afterEach:", error);
        }
    });

    afterAll(async () => {
        try {
            await delFiles(uploadDir);
            await delFilesInfo({ owners: "test@gmail.com" });
        } catch (error) {
            console.error("Error in afterAll:", error);
        }
    });

    describe('Upload File', () => {
        afterAll(async () => {
            try {
                await delFiles(uploadDir);
                await delFilesInfo({ owners: "test@gmail.com" });
            } catch (error) {
                console.error("Error in afterAll:", error);
            }
        });
        it("Should upload file successfully", async () => {
            try {
                const response = await createTheFile("Mockfile.txt", Date.now(), "test@gmail.com");
                expect(response.message).toBe('File uploaded successfully!');
                expect(response).toHaveProperty("file");
                await delFiles(uploadDir);
                await delFilesInfo({ owners: response.file.owners, filename: response.file.filename });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should upload only 1 file as uploading the same files", async () => {
            try {
                const res = await createTheFile("Mockfile.txt", "", "test@gmail.com");
                if (res) {
                    const response = await createTheFile("Mockfile.txt", "", "test@gmail.com");
                    if (response) {
                        expect(response.message).toBe('File uploaded successfully');
                        expect(response).not.toHaveProperty("file");
                    }
                    // console.log(res)
                    // console.log(response)

                    await delFiles(uploadDir);
                    await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                }

            } catch (error) {
                console.error("Error in test:", error);
            }
        });
    });

    describe('Update File', () => {
        it("Should update file successfully", async () => {
            try {
                let owner = "test@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const response = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "Updated!") }, file.filename, owner);
                expect(response.message).toBe('File updated successfully!');
                await delFiles(uploadDir);
                await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                // await delFilesInfo({ owners: owner, filename: file.filename });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Fail to update due to file deletion", async () => {
            try {
                let owner = "test@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const r = await deleteFile(res.file.filename, res.file.owners);
                const response = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "Updated!") }, file.filename, owner);
                expect(response.message).toBe('Error updating file: the file doesnt exist in the Server File System!');
                await delFiles(uploadDir);
                await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                // await delFilesInfo({ owners: owner, filename: file.filename });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });


        it("Fail to update due to lack of edit permission", async () => {
            try {
                let owner = "test@gmail.com";
                let editor = "test1@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const r = await sharingFile(res.file.filename, res.file.owners, editor, "view")
                const response = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "Updated!") }, file.filename, editor);
                expect(response.message).toBe("Error updating file: user lacks permissions to update this file");
                await delFiles(uploadDir);
                await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                await delSharesInfo({ owner: owner, filename: file.filename, email: editor });
                // await delFilesInfo({ owners: owner, filename: file.filename });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });


        it("Successfully Update File with editing permission", async () => {
            try {
                let owner = "test@gmail.com";
                let editor = "test1@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const r = await sharingFile(res.file.filename, editor, "edit")
                const response = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "Updated!") }, file.filename, editor);
                expect(response.message).toBe("File updated successfully!");
                await delFiles(uploadDir);
                // await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                // await delSharesInfo({ owner: owner, filename: file.filename, email: editor });
                // await delFilesInfo({ owners: owner, filename: file.filename });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Fail to update due to lack of permission", async () => {
            try {
                let owner = "test@gmail.com";
                let editor = "test1@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const response = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "Updated!") }, file.filename, editor);
                expect(response.message).toBe("Error updating file: user lacks permissions to update this file");
                await delFiles(uploadDir);
                await delFilesInfo({ owners: res.file.owners, filename: res.file.filename });
                await delSharesInfo({ owner: owner, filename: file.filename, email: editor });

            } catch (error) {
                console.error("Error in test:", error);
            }
        });
    });

    describe('Delete File', () => {
        it("Should delete file successfully", async () => {
            try {
                let owner = "test@gmail.com";
                let sharer = " test1@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const r = await sharingFile(file.filename, sharer, 'view');
                const response = await deleteFile(file.filename);
                expect(response.message).toBe('File deleted successfully!');
                const fileExists = await checkFileExists(file.filepath);
                expect(fileExists).toBe(false);
                const f = await File.findOne({ where: { filepath: file.filepath, filename: file.filename } })
                expect(f.deleted).toBe(true);
                const s = await Share.findOne({ where: { filename: file.filename, owner, email: sharer } })
                expect(s).toBeNull();
                // console.log(fileExists, response,f,s)
                await delFiles(uploadDir);
                await delFilesInfo({ owners: owner });
            } catch (error) {
                console.error("Error in test:", error);
            }
        });


    });

    describe('Get Files', () => {
        it("Should get files successfully when there are updated file, file deletion, sharing file, undoing sharing", async () => {
            try {
                const owner = "test@gmail.com";
                const ownerActor = "test1@gmail.com";
                // Case 1: Own a file
                let res1 = await createTheFile("Mockfile.txt", "1", owner);
                let file1 = await findFileInfoOnContent('This is a test file' + "1", owner);
                // console.log(file1.filename);
                // Case 2: Own and update a file
                let res2 = await createTheFile("Mockfile.txt", "2", owner)
                const file2 = await findFileInfoOnContent('This is a test file' + "2", owner);
                // console.log(file2.filename);
                const r2 = await updateFile({ originalname: "Mockfile.txt", buffer: Buffer.from('This is a test file' + "2Updated!") }, file2.filename, owner, owner);
                // Case 3: A share member of a file
                let res3 = await createTheFile("Mockfile.txt", "3", ownerActor)
                const file3 = await findFileInfoOnContent('This is a test file' + "3", ownerActor);
                // console.log(file3.filename);
                const r3 = await sharingFile(file3.filename, owner, "edit");
                // Case 4: own a file then delete it
                let res4 = await createTheFile("Mockfile.txt", "4", owner)
                const file4 = await findFileInfoOnContent('This is a test file' + "4", owner);
                // console.log(file4.filename);
                const r4 = await deleteFile(file4.filename);

                // Case 4: Be shared with a file but then be get rid of sharing list
                let res5 = await createTheFile("Mockfile.txt", "5", ownerActor)
                const file5 = await findFileInfoOnContent('This is a test file' + "5", ownerActor);
                console.log(file5.filename);
                const r5 = await sharingFile(file5.filename, owner, "edit");
                const r55 = await undoSharingFile(file5.filename, ownerActor)
                // console.log(r55)

                // Expected to have: 3 file and a file with version 2

                const response = await getAllFiles(owner);
                expect(response.message).toBe('Files got successfully!');
                // console.log(response);
                expect(response.files.length).toEqual(3);
                for (let index = 0; index < response.files.length; index++) {
                    if (response.files[index].filename === file2.filename) {
                        expect(response.files[index].version).toEqual(2);
                    }
                }


                await delFiles(uploadDir);
                await delFilesInfo({ owners: owner });
                await delFilesInfo({ owners: ownerActor });
                await delSharesInfo({ owner: ownerActor });
                // await delFilesInfo({ owners: owner, filename: file2.filename });
                // await delFilesInfo({ owners: ownerActor, filename: file3.filename });
                // await delShares({ owner: ownerActor, email: owner, filename: file3.filename });
                // await delFilesInfo({ owners: owner, filename: file4.filename });
                // await delFilesInfo({ owners: ownerActor, filename: file5.filename });
                // await delSharesInfo({ owner: ownerActor, email: owner, filename: file5.filename })

            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should get files successfully", async () => {
            try {
                const owner = "test@gmail.com";
                let res = [];
                for (let index = 1; index <= 4; index++) {
                    // console.log(index);
                    res[index] = await createTheFile("Mockfile.txt", index, owner);
                }

                const response = await getAllFiles(owner);
                expect(response.message).toBe('Files got successfully!');
                expect(response.files.length).toEqual(4);

                await delFiles(uploadDir);
                for (let index = 1; index < res.length; index++) {
                    let file = await findFileInfoOnContent('This is a test file' + index, owner);
                    await delFilesInfo({ owners: owner, filename: file.filename });
                }
            } catch (error) {
                console.error("Error in test:", error);
            }
        });
    });

    describe("Share the file", () => {
        it("Should share file with view permission successfully", async () => {
            try {
                let owner = "test@gmail.com";
                let email = "user@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const response = await sharingFile(file.filename, email, "view");
                expect(response.message).toBe("File shared successfully!");
                const share = await Share.findOne({ where: { filename: file.filename, owner, email } });
                expect(share.permission).toBe("view");
                await delFilesInfo({ owners: owner });
                await delSharesInfo({ owner });
                await delFiles(uploadDir);
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should undo sharing file successfully", async () => {
            try {
                let owner = "test@gmail.com";
                let email = "user@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const resp = await sharingFile(file.filename, email, "view");
                const response = await undoSharingFile(file.filename, owner);

                expect(response.message).toBe("File undid sharing successfully!");
                const share = await Share.findOne({ where: { filename: file.filename, owner, email } });
                expect(share).toBeNull();
                await delFilesInfo({ owners: owner });
                await delFiles(uploadDir);
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should fail to undo sharing file due to wrong input info", async () => {
            try {
                let owner = "test@gmail.com";
                let email = "user@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const resp = await sharingFile(file.filename, email, "view");
                const response = await undoSharingFile(file.filename, email);
                expect(response.message).toBe("Error sharing file: only owner is able to undo sharing this file");
                const share = await Share.findOne({ where: { filename: file.filename, owner, email } });
                expect(share).not.toBeNull();
                await delFilesInfo({ owners: owner });
                await delSharesInfo({ owner })
                await delFiles(uploadDir);
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should fail to undo sharing file due to deleted file", async () => {
            try {
                let owner = "testwrong@gmail.com";
                let email = "user@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const resp = await sharingFile(file.filename, email, "view");
                const re = await deleteFile(file.filename);
                const response = await undoSharingFile(file.filename, owner);
                expect(response.message).toBe("Error sharing file: File is deleted");
                const share = await Share.findOne({ where: { filename: file.filename, owner, email } });
                // console.log(resp,re, response, share)
                expect(share).toBeNull();
                await delFilesInfo({ owners: owner });
                // await delSharesInfo({ owner })
                await delFiles(uploadDir);
            } catch (error) {
                console.error("Error in test:", error);
            }
        });

        it("Should share file with edit permission successfully", async () => {
            try {
                let owner = "test@gmail.com";
                let email = "user@gmail.com";
                const res = await createTheFile("Mockfile.txt", "", owner);
                const file = await findFileInfoOnContent('This is a test file' + "", owner);
                const response = await sharingFile(file.filename, email, "edit");
                // console.log(response)
                expect(response.message).toBe("File shared successfully!");
                const share = await Share.findOne({ where: { filename: file.filename, owner, email } });
                expect(share.permission).toBe("edit");
                await delFilesInfo({ owners: owner });
                await delSharesInfo({ owner });
                await delFiles(uploadDir);
            } catch (error) {
                console.error("Error in test:", error);
            }
        });
    });

    describe("Publicize the file", () => {

        it("Should publicize file successfully", async () => {

            let owner = "test@gmail.com";
            const res = await createTheFile("Mockfile.txt", "", owner);
            const file = await findFileInfoOnContent('This is a test file' + "", owner);

            const response = await request(app)
                .put('/api/v2/file/file-privacy')
                .send(
                    {
                        name: file.filename,
                        privacy: "private"
                    }
                )

            console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message");
            expect(response.body.message).toBe("File privatized successfully!");

            await delFilesInfo({ owners: owner });
            await delFiles(uploadDir);


        });
    })
});
