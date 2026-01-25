interface WebSocketClient {
  userId: string;
  ws: WebSocket;
  rooms: Set<string>;
}

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();

  addClient(userId: string, ws: WebSocket) {
    this.clients.set(userId, {
      userId,
      ws,
      rooms: new Set(),
    });
  }

  removeClient(userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      for (const room of client.rooms) {
        this.leaveRoom(userId, room);
      }
      this.clients.delete(userId);
    }
  }

  joinRoom(userId: string, roomId: string) {
    const client = this.clients.get(userId);
    if (!client) return;

    client.rooms.add(roomId);

    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, new Set());
    }
    this.roomSubscriptions.get(roomId)!.add(userId);
  }

  leaveRoom(userId: string, roomId: string) {
    const client = this.clients.get(userId);
    if (client) {
      client.rooms.delete(roomId);
    }

    const roomSubs = this.roomSubscriptions.get(roomId);
    if (roomSubs) {
      roomSubs.delete(userId);
      if (roomSubs.size === 0) {
        this.roomSubscriptions.delete(roomId);
      }
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    const client = this.clients.get(userId);
    if (client) {
      client.ws.send(JSON.stringify({ event, data }));
    }
  }

  sendToRoom(roomId: string, event: string, data: unknown, excludeUserId?: string) {
    const roomSubs = this.roomSubscriptions.get(roomId);
    if (!roomSubs) return;

    const message = JSON.stringify({ event, data });
    for (const userId of roomSubs) {
      if (userId !== excludeUserId) {
        const client = this.clients.get(userId);
        if (client) {
          client.ws.send(message);
        }
      }
    }
  }

  broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ event, data });
    for (const client of this.clients.values()) {
      client.ws.send(message);
    }
  }

  getOnlineUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  isUserOnline(userId: string): boolean {
    return this.clients.has(userId);
  }
}

export const wsManager = new WebSocketManager();

export interface WSMessage {
  type: "join_room" | "leave_room" | "send_message" | "typing" | "ping";
  roomId?: string;
  content?: string;
}

export function handleWebSocketMessage(userId: string, message: WSMessage) {
  switch (message.type) {
    case "join_room":
      if (message.roomId) {
        wsManager.joinRoom(userId, message.roomId);
      }
      break;

    case "leave_room":
      if (message.roomId) {
        wsManager.leaveRoom(userId, message.roomId);
      }
      break;

    case "typing":
      if (message.roomId) {
        wsManager.sendToRoom(message.roomId, "user_typing", { userId, roomId: message.roomId }, userId);
      }
      break;

    case "ping":
      wsManager.sendToUser(userId, "pong", { timestamp: Date.now() });
      break;
  }
}
