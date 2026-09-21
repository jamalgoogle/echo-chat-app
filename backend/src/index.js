import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import routes from './routes/index.js';
import { UPLOAD_DIR } from './config/multer.js';
import { createSocketServer } from './config/socket.js';
import { registerSockets } from './sockets/index.js';
import { errorHandler } from './middleware/error.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set (see .env.example)');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Uploaded files are public to anyone holding the (unguessable, UUID) URL.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // lets the Vite app on :5173 embed them
    },
  })
);

const io = createSocketServer(server, CLIENT_URL);
registerSockets(io);
app.set('io', io); // controllers use this to push events (e.g. chat_created)

app.use('/api', routes);
app.use(errorHandler);

server.listen(PORT, () => console.log(`API + sockets listening on http://localhost:${PORT}`));
