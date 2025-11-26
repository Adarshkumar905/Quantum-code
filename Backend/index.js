import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from "body-parser";
import {createServer} from "http";
import helmet from 'helmet';

import {initSocket} from "./lib/socket.js";
import { connectToDatabase } from './lib/db.js';
import Roomroutes from './module/Room/route.js';

const PORT = process.env.PORT || 4200;

const app = express();
const server = createServer(app);

app.use(cors());
app.use(helmet()); 
app.use(bodyParser.json());
app.get('/', (_, res) => {
    res.status(200).send('Server is running and healthy!');
});
app.use("/Room", Roomroutes);

const startServer = async () => {
    try {
        await connectToDatabase();
        initSocket(server);
        server.listen(PORT, '0.0.0.0', () => {
        });
        
    } catch (error) {
        process.exit(1); 
    }
};

//shutdown handling
process.on('SIGINT', () => {
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => { 
    server.close(() => {
        process.exit(0);
    });
});

startServer();