import { io, Socket } from 'socket.io-client';
import { INotificationItem } from '../types/notification.types';

export interface ContestLeaderboardUpdatePayload {
  monthKey: string;
  leaderboard: any[];
  updatedAt: string;
}

export interface ContestActivityPayload {
  userName: string;
  avatar?: string;
  problemTitle?: string;
  problemSlug: string;
  difficulty?: string;
  pointsEarned?: number;
  timestamp: string;
}

export interface IDuelChatMessage {
  id: string;
  userId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

class ClientSocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  /**
   * Connect to real-time engine or return active socket
   */
  public connect(userId?: string): Socket {
    if (userId) {
      this.currentUserId = userId;
    }

    if (this.socket && this.socket.connected) {
      if (userId) {
        this.socket.emit('authenticate', { userId });
      }
      return this.socket;
    }

    if (this.socket) {
      return this.socket;
    }

    const explicitSocketUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL) || '';
    const apiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';
    let socketUrl = 'http://localhost:5000';

    if (explicitSocketUrl) {
      socketUrl = explicitSocketUrl;
    } else if (apiUrl.startsWith('http')) {
      try {
        const urlObj = new URL(apiUrl);
        socketUrl = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        socketUrl = 'http://localhost:5000';
      }
    } else if (typeof window !== 'undefined' && window.location.origin) {
      // In dev Vite environment (port 5173), server runs on port 5000
      socketUrl = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
    }

    this.socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      auth: {
        userId: this.currentUserId,
      },
    });

    this.socket.on('connect', () => {
      console.log('[Socket.io] Real-time engine connected (ID: ' + this.socket?.id + ')');
      if (this.currentUserId) {
        this.socket?.emit('authenticate', { userId: this.currentUserId });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Real-time engine disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.debug('[Socket.io] Connection notice:', err.message);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  /**
   * Associate socket with authenticated student/admin ID
   */
  public authenticate(userId: string): void {
    this.currentUserId = userId;
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId });
    } else {
      this.connect(userId);
    }
  }

  /**
   * Subscribe to real-time notifications for the current user
   */
  public onNotification(callback: (notification: INotificationItem) => void): () => void {
    const socket = this.connect();
    socket.on('notification:new', callback);
    return () => {
      socket.off('notification:new', callback);
    };
  }

  /**
   * Join live contest room for instant leaderboard updates
   */
  public joinContest(monthKey?: string): void {
    const socket = this.connect();
    socket.emit('join:contest', monthKey || 'active');
  }

  /**
   * Leave contest room
   */
  public leaveContest(monthKey?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:contest', monthKey || 'active');
    }
  }

  /**
   * Subscribe to live contest leaderboard shifts
   */
  public onLeaderboardUpdate(callback: (payload: ContestLeaderboardUpdatePayload) => void): () => void {
    const socket = this.connect();
    socket.on('contest:leaderboard_update', callback);
    return () => {
      socket.off('contest:leaderboard_update', callback);
    };
  }

  /**
   * Subscribe to live contest activity ticker
   */
  public onContestActivity(callback: (activity: ContestActivityPayload) => void): () => void {
    const socket = this.connect();
    socket.on('contest:activity', callback);
    return () => {
      socket.off('contest:activity', callback);
    };
  }

  /**
   * Join live 1vs1 Code Duel room
   */
  public joinDuel(roomCode: string, userId?: string, name?: string): void {
    const socket = this.connect();
    socket.emit('duel:join', { roomCode, userId, name });
  }

  /**
   * Leave live 1vs1 Code Duel room
   */
  public leaveDuel(roomCode: string, userId?: string, name?: string, teamSize?: number): void {
    if (this.socket?.connected) {
      this.socket.emit('duel:leave', { roomCode, userId, name, teamSize });
    }
  }

  /**
   * Emit typing indicator & code percentage progress to opponent
   */
  public sendDuelTyping(roomCode: string, isTyping: boolean, codePercent?: number, codeLength?: number): void {
    if (this.socket?.connected) {
      this.socket.emit('duel:typing', { roomCode, isTyping, codePercent, codeLength });
    }
  }

  /**
   * Emit test case progress to opponent
   */
  public sendDuelProgress(roomCode: string, testCasesPassed: number, totalTestCases: number): void {
    if (this.socket?.connected) {
      this.socket.emit('duel:progress', { roomCode, testCasesPassed, totalTestCases });
    }
  }

  /**
   * Listen for duel start event (when 2nd player joins)
   */
  public onDuelStart(callback: (data: any) => void): () => void {
    const socket = this.connect();
    socket.on('duel:start', callback);
    return () => {
      socket.off('duel:start', callback);
    };
  }

  /**
   * Listen for opponent typing indicator and code progress
   */
  public onDuelOpponentTyping(callback: (data: { userId: string; isTyping: boolean; codePercent?: number; codeLength?: number }) => void): () => void {
    const socket = this.connect();
    socket.on('duel:opponent_typing', callback);
    return () => {
      socket.off('duel:opponent_typing', callback);
    };
  }

  /**
   * Listen for opponent test case progress update
   */
  public onDuelOpponentProgress(callback: (data: { userId: string; testCasesPassed: number; totalTestCases: number }) => void): () => void {
    const socket = this.connect();
    socket.on('duel:opponent_progress', callback);
    return () => {
      socket.off('duel:opponent_progress', callback);
    };
  }

  /**
   * Listen for game over announcement
   */
  public onDuelGameOver(callback: (data: any) => void): () => void {
    const socket = this.connect();
    socket.on('duel:game_over', callback);
    return () => {
      socket.off('duel:game_over', callback);
    };
  }

  /**
   * Listen for opponent disconnect / leave
   */
  public onDuelOpponentLeft(callback: (data: any) => void): () => void {
    const socket = this.connect();
    socket.on('duel:opponent_left', callback);
    return () => {
      socket.off('duel:opponent_left', callback);
    };
  }

  /**
   * Listen for player joined lobby event in group battles
   */
  public onDuelPlayerJoined(callback: (data: any) => void): () => void {
    const socket = this.connect();
    socket.on('duel:player_joined', callback);
    return () => {
      socket.off('duel:player_joined', callback);
    };
  }

  /**
   * Listen for player rejoined event
   */
  public onDuelPlayerRejoined(callback: (data: any) => void): () => void {
    const socket = this.connect();
    socket.on('duel:player_rejoined', callback);
    return () => {
      socket.off('duel:player_rejoined', callback);
    };
  }

  /**
   * Send in-battle chat message to all room participants
   */
  public sendDuelChatMessage(roomCode: string, message: string, senderName?: string): void {
    const socket = this.connect();
    socket.emit('duel:chat_message', { roomCode, message, senderName });
  }

  /**
   * Listen for incoming in-battle chat messages
   */
  public onDuelChatMessage(callback: (msg: IDuelChatMessage) => void): () => void {
    const socket = this.connect();
    socket.on('duel:chat_message', callback);
    return () => {
      socket.off('duel:chat_message', callback);
    };
  }

  /**
   * Emit chat typing indicator with user's name
   */
  public sendDuelChatTyping(roomCode: string, isTyping: boolean, senderName?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('duel:chat_typing', { roomCode, isTyping, senderName });
    }
  }

  /**
   * Listen for opponent chat typing status
   */
  public onDuelOpponentChatTyping(callback: (data: { userId?: string; senderName: string; isTyping: boolean }) => void): () => void {
    const socket = this.connect();
    socket.on('duel:opponent_chat_typing', callback);
    return () => {
      socket.off('duel:opponent_chat_typing', callback);
    };
  }

  /**
   * Send rematch request to opponent
   */
  public sendDuelRematchRequest(roomCode: string, senderName?: string, senderId?: string): void {
    const socket = this.connect();
    socket.emit('duel:rematch_request', { roomCode, senderName, senderId });
  }

  /**
   * Send rematch decline to opponent
   */
  public sendDuelRematchDecline(roomCode: string, senderName?: string): void {
    const socket = this.connect();
    socket.emit('duel:rematch_decline', { roomCode, senderName });
  }

  /**
   * Listen for incoming rematch request
   */
  public onDuelRematchRequest(callback: (data: { roomCode: string; senderName?: string; senderId?: string }) => void): () => void {
    const socket = this.connect();
    socket.on('duel:rematch_request', callback);
    return () => {
      socket.off('duel:rematch_request', callback);
    };
  }

  /**
   * Listen for incoming rematch decline
   */
  public onDuelRematchDecline(callback: (data: { roomCode: string; senderName?: string }) => void): () => void {
    const socket = this.connect();
    socket.on('duel:rematch_decline', callback);
    return () => {
      socket.off('duel:rematch_decline', callback);
    };
  }

  /**
   * Clean disconnect
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new ClientSocketService();
