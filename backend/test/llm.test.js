const request = require('supertest');
const app = require('../index');
const fs = require('fs').promises;
const path = require('path');
const { key } = require('../helper/HMACkey');
const crypto = require('crypto');
const File = require('../models/file');
const { uploadFile } = require('../services/fileServiceV2');


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

async function createTheFile( filepath, owner) {
  try {
    let file = {};
    file.originalname = "Mockfile.jpg";
    file.buffer = await fs.readFile(filepath)
    const res = await uploadFile(file, owner);

    return res;

  } catch (error) {
    console.error("Error creating file:", error);
  }
}

async function findFileInfoOnContent(filepath, owner) {
  try {
    let buffer = await fs.readFile(filepath)
    let hash = await crypto.createHmac('sha256', key).update(buffer).digest('hex');
    // console.log(hash)
    const file = await File.findOne({ where: { owners: owner, hash }, order: [["id", "DESC"]] });
    // console.log(file)
    return file;
  } catch (error) {
    console.error("Error during the info finding: " + error)
  }
}

describe('LLM Service', () => {
  const filePath = path.join(__dirname, './file3.jpg'); // Assuming file.jpg exists in the same directory
  const uploadDir = path.join(__dirname, '../uploads');

  beforeAll(async () => {
    // Ensure upload directory exists
    try {
      await ensureDirectoryExistence(uploadDir);
    } catch (error) {
      console.error("Error in beforeAll:", error);
    }
  });


  describe('Detect Text from Image', () => {
    afterAll(async () => {
      try {
        await delFiles(uploadDir);
        await delFilesInfo({ owners: "test@gmail.com" });
      } catch (error) {
        console.error("Error in afterAll:", error);
      }
    });

    it('Should Detect Text Successfully', async () => {
      try {
        
        const res = await createTheFile(filePath, "test@gmail.com");
        const ress = await findFileInfoOnContent(res.file.filepath,"test@gmail.com");
        let filename = ress.filename;

        const response = await request(app)
          .post('/api/v1/llm/detect-text')
          // .attach('file', fileBuffer, 'image.jpg');
          .send(
            {
              // "filepath": filePath,
              // "prompt" : "What is inside the picture?"
              "name": filename
            }
          )
        console.log(response)
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('prediction');
      } catch (error) {
        console.error(error);
      }
    }, 100000); // Extend timeout if needed
  });

  describe('Extract Text from Image', () => {
    afterAll(async () => {
      try {
        await delFiles(uploadDir);
        await delFilesInfo({ owners: "test@gmail.com" });
      } catch (error) {
        console.error("Error in afterAll:", error);
      }
    });

    it('Should Extract Text Successfully', async () => {
      // let fileBuffer;
      try {
        // console.log(filePath)
        fileBuffer = await fs.readFile(filePath);
        const response = await request(app)
          .post('/api/v1/llm/extract-text')
          .field('owner', "test@gmail.com")
          .attach('file', fileBuffer, 'Mockfile.jpg');
        
        console.log(response)
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('prediction');
      } catch (error) {
        console.error(error);
      }
    }, 100000); // Extend timeout if needed
  });
});
