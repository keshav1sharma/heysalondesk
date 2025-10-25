class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
  }

  /**
   * Initialize WebSocket handlers
   */
  initialize() {
    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      this.connectedUsers.set(socket.id, {
        connectedAt: new Date(),
        role: "supervisor",
      });

      socket.on("subscribe", (data) => {
        const room = data.room || "supervisor";
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);

        socket.emit("subscribed", {
          room,
          message: "Successfully subscribed to updates",
        });
      });

      socket.on("unsubscribe", (data) => {
        const room = data.room || "supervisor";
        socket.leave(room);
        console.log(`Client ${socket.id} left room: ${room}`);
      });

      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });

      socket.emit("connection_info", {
        socketId: socket.id,
        connectedClients: this.connectedUsers.size,
        serverTime: new Date().toISOString(),
      });
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

module.exports = WebSocketService;
