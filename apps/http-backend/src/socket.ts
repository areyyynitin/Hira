import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("user:join", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("user:leave", (userId: string) => {
      socket.leave(`user:${userId}`);
    });

    socket.on("workspace:join", (workspaceId: number | string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on("workspace:leave", (workspaceId: number | string) => {
      socket.leave(`workspace:${workspaceId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
}
