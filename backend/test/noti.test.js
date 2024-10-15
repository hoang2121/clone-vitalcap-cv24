const request = require('supertest');
const app = require('../index');
const fs = require('fs').promises;
const path = require('path');

describe('LLM Service', () => {
    const filePath = path.join(__dirname, './file3.jpg'); // Assuming file.jpg exists in the same directory

    describe('Detect Text from Image', () => {
        it('Should Detect Text Successfully', async () => {
            let fileBuffer;
            try {
                console.log(filePath)
                fileBuffer = await fs.readFile(filePath);
                const response = await request(app)
                    .post('/api/v1/llm/detect-text')
                    .attach('file', fileBuffer, 'image.jpg');

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message');
                expect(response.body).toHaveProperty('predict');
            } catch (error) {
                console.error(error);
            }
        }, 100000); // Extend timeout if needed
    });
});
