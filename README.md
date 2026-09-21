# Real-time chat app

React (Vite) + Tailwind + Zustand on the front, Express + Socket.io + Multer + Prisma/PostgreSQL on the back.
Uploads are stored in `backend/uploads` and served by `express.static`. No cloud storage.

## Run it

Needs Node 20+ and a running PostgreSQL.

    # 1. Backend
    cd backend
    cp .env.example .env          # set DATABASE_URL and a long random JWT_SECRET
    npm install
    npx prisma migrate dev --name init
    npm run dev                   # http://localhost:5000

    # 2. Frontend (new terminal)
    cd frontend
    cp .env.example .env
    npm install
    npm run dev                   # http://localhost:5173

Open the app in two different browsers (or one normal + one private window), register two users,
and start a chat between them.

## Socket events

| Event (client → server) | Payload | Notes |
|---|---|---|
| `send_message` | `{ chatId, content?, fileUrl?, fileName? }` + ack | Server validates membership, saves, broadcasts `new_message` |
| `typing` | `{ chatId, isTyping }` | Relayed to the rest of the room |
| `mark_read` | `{ chatId }` | Updates `ChatMember.lastReadAt`, relayed as `messages_read` |

Server → client: `new_message`, `typing`, `messages_read`, `presence`, `presence_snapshot`, `chat_created`.

## REST

`POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `GET /api/users?q=` ·
`GET /api/chats` · `POST /api/chats` · `GET /api/messages/:chatId?page=1` · `POST /api/messages/upload`
