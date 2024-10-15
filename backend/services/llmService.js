// const firebaseApp = require("../helper/firebaseApp");
// const { getStorage, ref, getDownloadURL } = require('firebase/storage');
// const { getDatabase, ref: dbRef, get, set, push, query, orderByChild, equalTo } = require("firebase/database");
// const db = getDatabase(firebaseApp);
// const storage = getStorage(firebaseApp);

// const { createWorker } = require('tesseract.js');
// const vision = require('@google-cloud/vision');
// const { ChatVertexAI } = require("@langchain/google-vertexai");
// const { StringOutputParser } = require("@langchain/core/output_parsers");
// const { ChatPromptTemplate } = require("@langchain/core/prompts");
// const { credentials, config } = require("../helper/LLMConfig");

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const OpenAI = require("openai");
const z = require("zod")
const File = require("../models/file");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { uploadFile } = require('./fileServiceV2');
const { key } = require('../helper/HMACkey');
const crypto = require('crypto');
function extractJson(text) {
    // Regular expression to extract JSON part
    const jsonMatch = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
    if (!jsonMatch) {
        throw new Error('No JSON data found.');
    }

    // Join all matches and parse
    const jsonString = jsonMatch.join('').trim();
    // return JSON.parse(jsonString);
    return jsonString;
}

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
function getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.pdf':
            return 'application/pdf';
        default:
            throw new Error('Unsupported file type');
    }
}

async function encodeFileToBase64(filePath) {
    const fileBase64 = await fs.readFile(filePath, { encoding: 'base64' });
    return fileBase64;
}


// Define the schema for each record
const recordSchema = z.object({
    time: z.string(),
    date: z.string().optional(),
    details: z.string()
});

// Define the schema for the overall JSON structure
const jsonSchema = z.object({
    records: z.array(recordSchema)
});

// Function to convert and validate JSON
function convertAndValidateJson(text) {
    // Extract JSON-like strings
    const jsonMatches = text.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g);
    if (!jsonMatches) {
        throw new Error('No JSON data found.');
    }

    // Join the matches into a single JSON string
    const jsonString = jsonMatches.join('');

    // Replace single quotes with double quotes and handle keys
    const formattedJsonString = jsonString
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/([a-zA-Z0-9_]+):/g, '"$1":'); // Add double quotes around keys

    // Remove any trailing commas which are not allowed in JSON
    const fixedJsonString = formattedJsonString
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

    try {
        // Parse JSON
        const parsedData = JSON.parse(fixedJsonString);

        // Validate using Zod
        // const validatedData = jsonSchema.parse(parsedData);
        // return validatedData;
        return parsedData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// function to search for file in the backend file system then convert it into base64 and 
// pass it to AI model and reformat response then send back to client
exports.detectText = async (filename) => {
    try {
        const file = await File.findOne({
            where: {
                filename
            }
        })

        if (!file) {
            return {
                message: "File does not exist in the system!"
            }
        }

        let filepath = file.filepath;
        // console.log(file)

        let prompt = "I have an image of a medical record, and I need to catch the vital information inside that picture and return with format like: {}";

        const apiKey = process.env.OPENAIAPIKEY || "";
        // console.log(apiKey)

        // Get the filename from the file path
        const fileName = path.basename(filepath);
        // console.log(fileName)

        // Path to your file (can be jpg, png, pdf, etc.)
        const fileN = path.resolve(fileName);
        // console.log(fileN)

        // const filePath = path.join(__dirname, '../uploads', filename);
        const existFile = await checkFileExists(filepath);
        if (!existFile) {
            return {
                message: "File does not exist in the system!"
            }
        }

        const mimeType = getMimeType(fileN);
        // console.log(mimeType)
        const base64File = await encodeFileToBase64(filepath);
        // console.log(base64File)
        if (!base64File) {
            return {
                message: "Error: cant read and convert file!"
            }
        }
        const openai = new OpenAI({ apiKey: apiKey });

        const payload = {
            model: "gpt-4o",  // Use the correct model identifier
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `${prompt}`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64File}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        };

        const response = await openai.chat.completions.create(payload);
        let prediction = response.choices[0].message.content;
        // prediction = convertAndValidateJson(response.choices[0].message.content)
        prediction = extractJson(response.choices[0].message.content)
        console.log(prediction)

        // Send Images and prompt 
        // const headers = {
        //     "Content-Type": "application/json",
        //     "Authorization": `Bearer ${apiKey}`,
        // };
        // // const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });
        // // console.log(response);
        // const prediction = convertAndValidateJson(response.choices[0].message.content);
        // const text = `
        // {
        //   records: [
        //     {
        //       time: '21h',
        //       date: '16.11.21',
        //       details: 'Kết Midazolam. Nằm yên. M.HA. dao động. Thở êm. 87g. 98%, 116l/ph 4U'
        //     },
        //     {
        //       time: '22h',
        //       details: 'Hít Magnesium. Nằm yên. M.HA. dao động cao. HA. 170, 180 mmHg'
        //     },
        //     {
        //       time: '0h',
        //       details: 'Hít Adrean. Nằm yên. M.HA. dao động. Thở êm'
        //     },
        //     {
        //       time: '3h',
        //       details: 'Hít. Magnesium. Nằm yên. Mach 107 lần/ph. HAXL. 160, 170 mmHg'
        //     },
        //     {
        //       time: '6h20',
        //       details: 'Hít Midazxlam. Nằm yên. Mach, HA. dao động'
        //     }
        //   ]
        // }
        // `;

        // const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        // const result = await model.generateContent([prompt, { inlineData: { data: Buffer.from(await fs.readFile(filepath)).toString("base64"), mimeType: 'image/jpg' } }]); 
        // console.log(extractJson(result.response.text()))
        // console.log(prediction);

        // const w = await createWorker("vie");
        // const fileBase64 = await fs.readFile(filepath);
        // const text = await w.recognize(fileBase64);
        // await w.terminate();
        // console.log(text.data.text)

        return { message: "Text detected successfully!", prediction }
    } catch (error) {
        // console.error('Error detecting text:', error);
        console.log(error)
        // Handle error appropriately, e.g., return a meaningful error message
        if (error.error) {
            return { message: 'An error occurred while detecting text.', errors: { error: error.error, code: error.code, type: error.type } };
        }
        return {
            message: 'An error occurred while detecting text: ' + error
        }

    }
};

// function to upload file then detect text inside it
exports.extractText = async (file, owner) => {
    try {
        let filename = "";
        const res1 = await uploadFile(file, owner);
       console.log(res1);
        if (res1.message !== "File uploaded successfully!"){
            if (res1.message === "File uploaded successfully"){
                // Create a hashed version of the file content for later verification
                const hash = await crypto.createHmac('sha256', key).update(file.buffer).digest('hex');

                // Retrieve file data from the database
                const duplicateFile = await File.findOne({
                    where: { hash, owners: owner },
                    order: [['id', 'DESC']],
                });
                filename = duplicateFile.filename;
     
            }else{
                return res1
            }

        }else{
            filename = res1.file.filename;
        }

        console.log(filename)
        const res2 = await this.detectText(filename);
        console.log(res2);
        if (res2.message !== "Text detected successfully!"){
            return res2;
        }

        return { message: "Text extracted successfully!", prediction: res2.prediction};

    } catch (error) {
        console.log(error);
        return { message: 'An error occurred while detecting text.', error };
    }
};





// exports.extractText = async (fileName) => {
//     const fileReference = ref(storage, `files/${fileName}`);

//     const url = await getDownloadURL(fileReference);

//     // Use tesseract.js to extract text from image
//     const w = await createWorker("vie");
//     const { data: { text } } = await w.recognize(url);
//     await w.terminate();
//     const convertedTextsReference = dbRef(db, "convertedTexts");
//     const duplicateCheck = query(convertedTextsReference, orderByChild("fileName"), equalTo(fileName));
//     const fileConverted =   await get(duplicateCheck);

//     if (fileConverted.exists()) {
//         return { message: "This image is already converted" };
//     }
//     const newTextReference = push(convertedTextsReference);
//     await set(newTextReference, {
//         text: text,
//         fileName: fileName,
//         time: new Date().toISOString()
//     });
//     return { text: "Text extracted from image successfully", text };
// };


// exports.detectText = async (fileBuffer) => {
//     try {
//         // create google vision client instance to latter use the their services
//         const client = new vision.ImageAnnotatorClient(config);
//         // detect text from the image's buffer 
//         const [result] = await client.textDetection(fileBuffer);

//         const output1 = result.fullTextAnnotation.text;

//         const model = new ChatVertexAI({
//             credentials,
//             model: "gemini-1.5-pro",
//             temperature: 0
//         });
//         // // use langChain and google Vertex model to format the output from gg vision
//         const prompt = ChatPromptTemplate.fromTemplate("Combine and format this output: {output1}");
//         const chain = prompt.pipe(model).pipe(new StringOutputParser());
//         const res = await chain.invoke({ output1: output1 });
//         // console.log(res)
//         if (res) {
//             return { message: "Text detected successfully!", predict: res };
//         } else {
//             return { message: 'No prediction could be made.' };
//         }
//     } catch (error) {
//         // console.error('Error detecting text:', error);
//         // console.log(error.details)
//         // Handle error appropriately, e.g., return a meaningful error message
//         if(error.details){
//             return { title: 'An error occurred while detecting text.', message: error.details };
//         }
//         return { message: 'An error occurred while detecting text.'  };
//     }
// };

// exports.detectTextV2 = async (file) => {
//     try {
//         const fileName = file.originalname;
//         const fileBuffer = file.buffer;
//         let data = new FormData();
//         data.append('file', fileBuffer, fileName);

//         // upload file to the Pipeline
//         let config1 = {
//             method: 'post',
//             maxBodyLength: Infinity,
//             url: 'http://192.168.63.185:5000/input',
//             headers: {
//                 ...data.getHeaders()
//             },
//             data: data,
//         }
//         const res1 = await axios.post(config1)

//         if (!res1) {
//             return { error: 'Failed to upload file.' };
//         }

//         // reformat the file
//         let config2 = {
//             method: 'get',
//             maxBodyLength: Infinity,
//             url: `http://192.168.63.185:5000/input_to_adaptive/${file.originalname}/True`,
//             headers: {}
//         };

//         const res2 = await axios.get(config2);

//         if (!res2) {
//             return { error: 'Failed to process adaptive input.' };
//         }
//         // run the text recognition process in the model
//         let config3 = {
//             method: 'get',
//             maxBodyLength: Infinity,
//             url: `http://192.168.63.185:5000/run_text_recognition/${file.originalname}/True`,
//             headers: {}
//         };

//         const res3 = await axios.get(config3);

//         if (!res3) {
//             return { error: 'Failed to run text recognition.' };
//         }
//         // get the file returned from the model
//         let config4 = {
//             method: 'get',
//             maxBodyLength: Infinity,
//             url: `http://192.168.63.185:5000/get-static-folder/TextRecognition/${file.originalname}`,
//             headers: {}
//         };

//         const res4 = await axios.get(config4);

//         if (!res4 || !res4.data) {
//             return { error: 'Failed to retrieve text recognition data.' };
//         }


//         const prediction = res4.data.map(dat => dat.predict).join('|');

//         return { message: "Text detected successfully!", predict: prediction };

//     } catch (error) {
//         console.error('Error detecting text:', error);
//         return { title: 'An error occurred while detecting text.', error };
//     }
// };


// exports.updateText = async (file,id,body) => {
//     try {

//         const fileName = file.originalname;
//         const fileBuffer = file.buffer;
//         let data = new FormData();
//         data.append('file', fileBuffer, fileName);

//         let config = {
//             method: 'put',
//             maxBodyLength: Infinity,
//             url: `http://192.168.63.185:5000/info?id=${id}`,
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             data: data
//         };

//         const res = await axios.request(config);
//         if(res){
//             return { error: 'Failed to update text.' };
//         }
//         return { message: "Text updated successfully!"};

//     } catch (error) {
//         console.error('Error detecting text:', error);
//         return { error: 'An error occurred while detecting text.' };
//     }
// };


// exports.deleteText = async (id, body) => {
//     try {
//         let config1 = {
//             method: 'post',
//             maxBodyLength: Infinity,
//             url: `http://192.168.63.185:5000/info?id=${id}`,
//             headers: {},
//             data: ''
//         }
//         const res1 = await axios.post(config1)

//         if (!res1) {
//             return { error: 'Failed to delete text.' };
//         }

//         return { message: "Text deleted successfully!"};

//     } catch (error) {
//         console.error('Error deleting text:', error);
//         return { error: 'An error occurred while deleting text.' };
//     }
// };
// exports.detectFile = async (file) => {
//     try {
//         const file_blob = new Blob([file.buffer], { type: file.mimetype })
//         const res = await axios.post("https://d80ea96e-d896-4e5f-9687-de04e4861a8f.mock.pstmn.io/input", {
//             file: file_blob
//         }, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             }
//         });
//         if (res) {
//             return { message: "Sent file successfully!"};
//         } else {
//             return { error: 'Cant predict File.' };
//         }
//     } catch (error) {
//         console.error('Error detecting file:', error);
//         // Handle error appropriately, e.g., return a meaningful error message
//         return { error: 'An error occurred while detecting file.' };
//     }
// };