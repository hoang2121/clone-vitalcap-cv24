const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const winston = require("winston");
const path = require("path");
const { request } = require("http");
const firebaseApp = require("./helper/firebaseApp")
const { getDatabase } =  require("firebase/database");
const database = getDatabase(firebaseApp);


// set up the logger to check the Grpc server activity
const logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
});

const PROTO_PATH = path.join(__dirname, "./protos", "realtime.proto");

// load the definition for the proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

// Load the data defined in the proto file
const realtimeProto = grpc.loadPackageDefinition(packageDefinition).RealtimeService;

// Store the Id of current chat user
const activeClients = new Map();

// define logic script for the services previously defined in the Proto file
async function connect(call, callback) {
    const { clientId } = call.request;
    logger.info(`Client ${clientId} connected`);
    activeClients.set(clientId, call);

    // console.log(activeClients.get(clientId).request)
    // await sendMessage(call)



    call.on('end', () => {
        activeClients.delete(clientId);
        logger.info(`Client ${clientId} disconnected`);
    });

    const response = {
        message: `Connection established for client: ${clientId}`,
    };
    callback(null, response);
}

function broadcastMessage(call) {
    const { clientId, content } = call.request;
    logger.info(`Client ${clientId} connected`);
    
    // activeClients.set(clientId, call);
    // console.log(call.request);
    // call.on("data", function(message)  {

    //     logger.info(`Received broadcast message from client ${message.clientId}: ${message.content}`);

    //     activeClients.forEach((client, id) => {
    //         if (id !== message.clientId) {
    //             logger.info(`Broadcast to client ${id}: ${message.content}`);
    //             const response = {
    //                 senderClientId: message.clientId,
    //                 content: message.content,
    //             };
    //             client.write(response);
    //         }
    //     });
    // });


    activeClients.forEach((client, id) => {
        // console.log(client, id);
        if (id !== clientId) {
        //     logger.info(`Broadcast to client ${id}: ${message.content}`);
            // let client = activeClients.get(id);
            // console.log(client);
            const response = {
                senderClientId: id,
                content: content,
            };
            console.log(response);
            // console.log(client);
            client.write(response);
        }
    });
    

    // call.on("end", () => {
    //     const { clientId } = call.request;
    //     if (clientId) logger.info(`Client ${clientId} stopped broadcasting`);
    //     else logger.info(`Client stopped broadcasting`);
        call.end();
    // });
}

async function sendMessage(call) {
    const { clientId, content } = call.request;
    logger.info(`Received message: ${content} from client ${clientId}`);
    // console.log(activeClients.get(clientId))
    const response = {
        clientId,
        content: `Message received: ${content}`,
    };
    call.request.senderClientId = clientId
    await broadcastMessage(call);

    call.write(response);
    call.end();
}

const PORT = 50051;
const HOST = "localhost";

const initializeGrpc = async () => {
    // Start a new grpc Server instance
    const server = new grpc.Server();

    // add the service defined in Proto file to the instance
    server.addService(realtimeProto.service, {
        Connect: connect,
        BroadcastMessage: broadcastMessage,
        SendMessage: sendMessage,
    });

    // start the server with credentical and log out the status of current server
    server.bindAsync(`${"0.0.0.0"}:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
        logger.info(`Server running at ${HOST}:${PORT}`);
        server.start();
    });

    return server;
};

module.exports = initializeGrpc;
