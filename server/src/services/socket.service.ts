import http from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { CodeDuel } from '../models/codeDuel.model';
import { User } from '../models/user.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { PlatformSettings } from '../models/settings.model';
import { calculatePrimeDistribution } from '../controllers/duel.controller';

function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, cookieStr) => {
    const parts = cookieStr.trim().split('=');
    const key = parts[0];
    const val = parts.slice(1).join('=');
    if (key) acc[key] = decodeURIComponent(val);
    return acc;
  }, {} as Record<string, string>);
}

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private pendingDuelDisconnects: Map<string, { timer: NodeJS.Timeout; roomCode: string; userId: string; name?: string; teamSize?: number }> = new Map();

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize Socket.io server attached to existing HTTP server
   */
  public init(httpServer: http.Server): Server {
    if (this.io) {
      return this.io;
    }

    const configuredOrigins = (config.clientUrl || '')
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    const allowedOrigins = [
      ...configuredOrigins,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ].filter(Boolean);

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) {
            return callback(null, true);
          }
          const normalizedOrigin = origin.replace(/\/+$/, '');
          if (allowedOrigins.some((allowed) => allowed === normalizedOrigin || allowed === '*')) {
            return callback(null, true);
          }
          if (config.nodeEnv !== 'production') {
            // Allow localhost / local dev preview hosts
            return callback(null, true);
          }
          logger.warn(`[Socket.io] CORS blocked unauthorized origin: ${origin}`);
          return callback(new Error('CORS origin unauthorized by NextEra security policy'));
        },
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    // Connection Cryptographic Authentication Middleware
    this.io.use((socket: Socket, next) => {
      try {
        let token: string | undefined = undefined;

        // 1. Check handshake auth token
        if (socket.handshake.auth && typeof socket.handshake.auth.token === 'string') {
          token = socket.handshake.auth.token;
        }

        // 2. Check Authorization header
        if (!token && socket.handshake.headers.authorization) {
          const authHeader = socket.handshake.headers.authorization;
          if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
          }
        }

        // 3. Check HTTP-only Secure Cookie
        if (!token && socket.handshake.headers.cookie) {
          const cookies = parseCookieHeader(socket.handshake.headers.cookie);
          token = cookies[config.cookieName];
        }

        // 4. Query param
        if (!token && socket.handshake.query && typeof socket.handshake.query.token === 'string') {
          token = socket.handshake.query.token;
        }

        if (token) {
          try {
            const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role?: string };
            socket.data.userId = decoded.id;
            socket.data.userRole = decoded.role;
            socket.data.isAuthenticated = true;
          } catch (jwtErr) {
            // Invalid token, continue as unauthenticated guest (allowed for public contest viewing)
            logger.debug(`[Socket.io] Handshake token invalid: ${(jwtErr as Error).message}`);
          }
        }

        next();
      } catch (err) {
        logger.error(`[Socket.io] Auth middleware error: ${(err as Error).message}`);
        next();
      }
    });

    this.setupEventHandlers();
    logger.info('[Socket.io] Real-Time Engine successfully initialized.');
    return this.io;
  }

  /**
   * Setup core socket connection and lifecycle handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const socketId = socket.id;
      const initialUserId = socket.data.userId;

      if (initialUserId && socket.data.isAuthenticated) {
        this.trackUserSocket(initialUserId, socketId);
        socket.join(`user:${initialUserId}`);
        logger.debug(`[Socket.io] Authenticated user connected: ${initialUserId} (Socket: ${socketId})`);
      } else {
        logger.debug(`[Socket.io] Public guest connected (Socket: ${socketId})`);
      }

      // Cryptographically verified authentication event for client-side login without hard reconnection
      socket.on('authenticate', (data: { token?: string; userId?: string; secret?: string }) => {
        let authenticatedUserId: string | null = null;

        // Verify with JWT token
        if (data?.token) {
          try {
            const decoded = jwt.verify(data.token, config.jwtSecret) as { id: string; role?: string };
            authenticatedUserId = decoded.id;
            socket.data.userId = decoded.id;
            socket.data.userRole = decoded.role;
            socket.data.isAuthenticated = true;
          } catch (err) {
            logger.warn(`[Socket.io] Authentication token verification failed: ${(err as Error).message}`);
            socket.emit('auth_error', { message: 'Invalid or expired authentication token.' });
            return;
          }
        } else if (socket.data.userId && socket.data.isAuthenticated && data?.userId === socket.data.userId) {
          // Already verified during handshake via HTTP-only cookie
          authenticatedUserId = socket.data.userId;
        } else if (data?.userId && config.nodeEnv !== 'production' && data?.secret === config.jwtSecret) {
          // Internal test runner bypass with secret
          authenticatedUserId = data.userId;
          socket.data.userId = data.userId;
          socket.data.isAuthenticated = true;
        } else {
          // Reject untrusted spoofing attempt
          logger.warn(`[Socket.io] Blocked unverified attempt to join user room: ${data?.userId || 'unknown'}`);
          socket.emit('auth_error', { message: 'Authentication required. Valid session cookie or token must be provided.' });
          return;
        }

        if (authenticatedUserId) {
          this.trackUserSocket(authenticatedUserId, socketId);
          socket.join(`user:${authenticatedUserId}`);
          socket.emit('authenticated', { success: true, userId: authenticatedUserId });
          logger.info(`[Socket.io] Socket ${socketId} authenticated for user ${authenticatedUserId}`);
        }
      });

      // Contest room subscription with input sanitization against room injection
      socket.on('join:contest', (monthKey?: string) => {
        const cleanKey = typeof monthKey === 'string' && /^[a-zA-Z0-9_-]{1,30}$/.test(monthKey) ? monthKey : 'active';
        socket.join(`contest:${cleanKey}`);
        socket.join('contest:active');
        logger.debug(`[Socket.io] Socket ${socketId} joined contest room: contest:${cleanKey}`);
      });

      socket.on('leave:contest', (monthKey?: string) => {
        const cleanKey = typeof monthKey === 'string' && /^[a-zA-Z0-9_-]{1,30}$/.test(monthKey) ? monthKey : 'active';
        socket.leave(`contest:${cleanKey}`);
        logger.debug(`[Socket.io] Socket ${socketId} left contest room: contest:${cleanKey}`);
      });

      // 1vs1 Live Coding Battles (Code Duels) Socket Listeners
      socket.on('duel:join', async (data?: string | { roomCode: string; userId?: string; name?: string }) => {
        const roomCode = typeof data === 'string' ? data : data?.roomCode;
        const userId = typeof data === 'object' && data.userId ? data.userId : socket.data.userId;
        const name = typeof data === 'object' && data.name ? data.name : undefined;
        if (!roomCode || typeof roomCode !== 'string') return;
        const cleanCode = roomCode.trim().toUpperCase();
        if (userId) socket.data.userId = userId;
        if (name) socket.data.name = name;
        socket.join(`duel:${cleanCode}`);

        if (userId) {
          socket.data.userId = userId;
          this.trackUserSocket(userId, socketId);

          const key = `${cleanCode}:${userId}`;
          const pending = this.pendingDuelDisconnects.get(key);
          let hadPendingDisconnect = false;
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingDuelDisconnects.delete(key);
            hadPendingDisconnect = true;
            logger.info(`[Socket.io] Cancelled pending disconnect for user ${userId} in duel:${cleanCode} (reconnected within grace period)`);
          }

          // Check DB: if user was marked 'forfeited', restore status to active
          try {
            const duel = await CodeDuel.findOne({ roomCode: cleanCode });
            if (duel && (duel.status === 'in-progress' || duel.status === 'waiting')) {
              const player = duel.players.find((p) => p.userId.toString() === userId.toString());
              let wasForfeited = false;
              if (player) {
                const hadLeft = Boolean(player.leftAt);
                player.leftAt = undefined; // Cleared on active rejoin
                if (player.status === 'forfeited' || player.status === 'joined') {
                  player.status = duel.status === 'in-progress' ? 'coding' : 'joined';
                  wasForfeited = true;
                }
                await duel.save();
                logger.info(`[Socket.io] Restored active player status and cleared leftAt for ${userId} in duel:${cleanCode}`);

                // ONLY emit duel:player_rejoined if player was genuinely disconnected, left, or forfeited!
                if (hadPendingDisconnect || wasForfeited || hadLeft) {
                  socket.to(`duel:${cleanCode}`).emit('duel:player_rejoined', {
                    userId,
                    name: name || player?.name || socket.data.name || 'Opponent',
                    roomCode: cleanCode,
                    players: duel.players,
                  });
                }
              }
            }
          } catch (err: any) {
            logger.warn(`[Socket.io] Error checking player status on duel:join: ${err.message}`);
          }
        }

        logger.debug(`[Socket.io] Socket ${socketId} (user: ${userId || 'guest'}) joined duel room: duel:${cleanCode}`);
      });

      socket.on('duel:leave', (data?: string | { roomCode: string; userId?: string; name?: string; teamSize?: number }) => {
        const roomCode = typeof data === 'string' ? data : data?.roomCode;
        const userId = typeof data === 'object' && data.userId ? data.userId : socket.data.userId;
        const name = typeof data === 'object' && data.name ? data.name : socket.data.name;
        const teamSize = typeof data === 'object' && data.teamSize ? data.teamSize : undefined;
        if (!roomCode || typeof roomCode !== 'string') return;
        const cleanCode = roomCode.trim().toUpperCase();

        // Clear any pending disconnect timer since this is an explicit leave
        if (userId) {
          const key = `${cleanCode}:${userId}`;
          const pending = this.pendingDuelDisconnects.get(key);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingDuelDisconnects.delete(key);
          }
        }

        socket.leave(`duel:${cleanCode}`);
        socket.to(`duel:${cleanCode}`).emit('duel:opponent_left', {
          socketId,
          userId,
          name,
          teamSize,
          roomCode: cleanCode,
        });
        logger.debug(`[Socket.io] Socket ${socketId} left duel room: duel:${cleanCode}`);

        // Asynchronously update player leftAt & forfeit status in DB for explicit leave
        if (userId) {
          CodeDuel.findOne({ roomCode: cleanCode })
            .then(async (duel) => {
              if (duel && (duel.status === 'in-progress' || duel.status === 'waiting')) {
                const player = duel.players.find((p) => p.userId.toString() === userId.toString());
                if (player) {
                  player.leftAt = new Date();
                  if (duel.status === 'in-progress') {
                    player.status = 'forfeited';

                    // Check if only 1 active player remains
                    const activePlayers = duel.players.filter((p) => p.status !== 'forfeited');
                    if (activePlayers.length === 1 && duel.status === 'in-progress') {
                      const winner = activePlayers[0];
                      duel.status = 'completed';
                      duel.winnerId = winner.userId;
                      duel.winningReason = 'opponent_forfeit';

                      if (duel.duelType === 'prime') {
                        const settings = await PlatformSettings.findOne().lean();
                        const primeConfig = settings?.primeDuelSettings;
                        const poolInfo = calculatePrimeDistribution(duel.entryFee, duel.players.length, {
                          platformFeePercent: duel.platformFeePercent || primeConfig?.platformFeePercent || 10,
                          twoPlayerPercentages: primeConfig?.twoPlayerPercentages,
                          squadPercentages: primeConfig?.squadPercentages,
                          grandRoyalePercentages: primeConfig?.grandRoyalePercentages,
                        });

                        const winnerReward = poolInfo.distribution[0]?.coins || poolInfo.netPool;
                        duel.primeWinners = [
                          {
                            userId: winner.userId,
                            name: winner.name,
                            rank: 1,
                            percentage: poolInfo.distribution[0]?.percentage || 100,
                            coinsAwarded: winnerReward,
                          },
                        ];
                        duel.coinsReward = winnerReward;
                        duel.totalPot = poolInfo.totalPot;
                        duel.platformFeeCollected = poolInfo.platformFee;
                        duel.netPrizePool = poolInfo.netPool;

                        await User.findByIdAndUpdate(winner.userId, {
                          $inc: { points: winnerReward, totalPoints: winnerReward },
                        });

                        try {
                          await PointTransaction.create({
                            userId: winner.userId,
                            amount: winnerReward,
                            type: 'PRIME_DUEL_WIN',
                            referenceType: 'CodeDuel',
                            referenceId: duel.roomCode,
                            description: `Victory (Opponent Forfeit) in Prime Battle (${duel.roomCode})`,
                          });
                        } catch (txErr: any) {
                          logger.warn(`PointTransaction error for forfeit win in socket: ${txErr.message}`);
                        }
                      } else {
                        // Standard Code Battle: 100% Free (No coins awarded or deducted)
                        duel.coinsReward = 0;
                      }

                      this.io?.to(`duel:${cleanCode}`).emit('duel:game_over', {
                        roomCode: duel.roomCode,
                        status: 'completed',
                        winnerId: winner.userId,
                        winnerName: winner.name,
                        winningReason: 'opponent_forfeit',
                        coinsAwarded: duel.coinsReward,
                        winningPlayer: winner,
                        players: duel.players,
                        duelType: duel.duelType,
                        primeWinners: duel.primeWinners,
                      });
                    }
                  } else if (duel.status === 'waiting') {
                    const isHost = duel.players[0]?.userId?.toString() === userId.toString();
                    if (isHost || duel.players.length <= 1) {
                      duel.status = 'cancelled';
                      // Refund any prime battle entry fees
                      for (const p of duel.players) {
                        if (p.coinsPaid && p.coinsPaid > 0) {
                          await User.findByIdAndUpdate(p.userId, { $inc: { points: p.coinsPaid } });
                          try {
                            await PointTransaction.create({
                              userId: p.userId,
                              amount: p.coinsPaid,
                              type: 'PRIME_DUEL_REFUND',
                              referenceType: 'CodeDuel',
                              referenceId: duel.roomCode,
                              description: `Refund for cancelled Prime Battle (${duel.roomCode})`,
                            });
                          } catch (txErr: any) {
                            logger.warn(`PointTransaction error for cancel refund in socket: ${txErr.message}`);
                          }
                        }
                      }
                      this.io?.to(`duel:${cleanCode}`).emit('duel:game_over', {
                        roomCode: duel.roomCode,
                        status: 'cancelled',
                        reason: 'Room cancelled by host',
                        players: duel.players,
                      });
                    }
                  }
                  await duel.save();
                  logger.info(`[Socket.io] Set leftAt timestamp for user ${userId} in duel:${cleanCode} (explicit leave)`);
                }
              }
            })
            .catch((err) => {
              logger.warn(`[Socket.io] Could not update forfeit status for duel ${cleanCode}: ${err.message}`);
            });
        }
      });

      socket.on('duel:typing', (data: { roomCode: string; isTyping: boolean; codePercent?: number; codeLength?: number }) => {
        if (!data?.roomCode) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        socket.to(`duel:${cleanCode}`).emit('duel:opponent_typing', {
          userId: socket.data.userId,
          isTyping: Boolean(data.isTyping),
          codePercent: typeof data.codePercent === 'number' ? data.codePercent : undefined,
          codeLength: typeof data.codeLength === 'number' ? data.codeLength : undefined,
        });
      });

      socket.on('duel:progress', (data: { roomCode: string; testCasesPassed: number; totalTestCases: number }) => {
        if (!data?.roomCode) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        socket.to(`duel:${cleanCode}`).emit('duel:opponent_progress', {
          userId: socket.data.userId,
          testCasesPassed: data.testCasesPassed,
          totalTestCases: data.totalTestCases,
        });
      });

      socket.on('duel:chat_message', (data: { roomCode: string; message: string; senderName?: string }) => {
        if (!data?.roomCode || !data?.message?.trim()) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        const chatPayload = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: socket.data.userId || 'anonymous',
          senderName: data.senderName || 'Anonymous',
          message: data.message.trim().substring(0, 300),
          timestamp: new Date().toISOString(),
        };
        this.io?.to(`duel:${cleanCode}`).emit('duel:chat_message', chatPayload);
      });

      socket.on('duel:chat_typing', (data: { roomCode: string; isTyping: boolean; senderName?: string }) => {
        if (!data?.roomCode) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        socket.to(`duel:${cleanCode}`).emit('duel:opponent_chat_typing', {
          userId: socket.data.userId,
          senderName: data.senderName || socket.data.name || 'Opponent',
          isTyping: Boolean(data.isTyping),
        });
      });

      // Rematch / Replay Socket Handlers
      socket.on('duel:rematch_request', (data: { roomCode: string; senderName?: string; senderId?: string }) => {
        if (!data?.roomCode) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        socket.to(`duel:${cleanCode}`).emit('duel:rematch_request', {
          roomCode: cleanCode,
          senderName: data.senderName || socket.data.name || 'Opponent',
          senderId: data.senderId || socket.data.userId,
        });
        logger.info(`[Socket.io] Rematch requested in duel:${cleanCode} by ${data.senderName || socket.data.name}`);
      });

      socket.on('duel:rematch_decline', (data: { roomCode: string; senderName?: string }) => {
        if (!data?.roomCode) return;
        const cleanCode = data.roomCode.trim().toUpperCase();
        socket.to(`duel:${cleanCode}`).emit('duel:rematch_decline', {
          roomCode: cleanCode,
          senderName: data.senderName || socket.data.name || 'Opponent',
        });
        logger.info(`[Socket.io] Rematch declined in duel:${cleanCode} by ${data.senderName || socket.data.name}`);
      });

      // Handle socket disconnecting with 6-second reconnection grace period debounce
      socket.on('disconnecting', () => {
        const userId = socket.data.userId;
        const name = socket.data.name;

        for (const room of socket.rooms) {
          if (room.startsWith('duel:')) {
            const cleanCode = room.replace('duel:', '');

            // Ignore unauthenticated or anonymous transport blip sockets
            if (!userId) {
              logger.debug(`[Socket.io] Anonymous socket ${socketId} left duel room ${room}, ignoring leave broadcast`);
              continue;
            }

            // Check if user still has other active sockets globally
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet && userSocketSet.size > 1) {
              logger.debug(`[Socket.io] User ${userId} disconnected socket ${socketId}, but still has ${userSocketSet.size - 1} other socket(s) active. Skipping duel leave alert.`);
              continue;
            }

            // 6-Second Reconnection Grace Period Debounce
            const key = `${cleanCode}:${userId}`;
            const existing = this.pendingDuelDisconnects.get(key);
            if (existing) {
              clearTimeout(existing.timer);
            }

            const timer = setTimeout(() => {
              this.pendingDuelDisconnects.delete(key);

              // 1. Re-verify if user is still actively connected inside this specific duel room on another socket
              const roomSockets = this.io?.sockets.adapter.rooms.get(`duel:${cleanCode}`);
              let isUserStillInRoom = false;
              if (roomSockets) {
                for (const sid of roomSockets) {
                  const s = this.io?.sockets.sockets.get(sid);
                  if (s && s.data.userId && s.data.userId.toString() === userId.toString()) {
                    isUserStillInRoom = true;
                    break;
                  }
                }
              }

              if (isUserStillInRoom) {
                logger.debug(`[Socket.io] Grace period expired for ${userId} in ${cleanCode}, but user is actively connected on another socket in this room. Skipping duel leave alert.`);
                return;
              }

              // 2. Re-verify if user still has other active sockets globally
              const currentSockets = this.userSockets.get(userId);
              if (currentSockets && currentSockets.size > 0) {
                logger.debug(`[Socket.io] Grace period expired for ${userId} in ${cleanCode}, but user has active sockets. Skipping opponent_left.`);
                return;
              }

              // 3. Emit opponent_left for notification only (does not forfeit DB status)
              this.io?.to(`duel:${cleanCode}`).emit('duel:opponent_left', {
                socketId,
                userId,
                name,
                roomCode: cleanCode,
              });
              logger.info(`[Socket.io] Grace period expired (6s). Broadcasted opponent_left for user ${userId} in duel:${cleanCode}`);

              // 4. Record leftAt in DB so accidental disconnect/tab close gets 2-minute rejoin window
              CodeDuel.findOne({ roomCode: cleanCode })
                .then(async (duel) => {
                  if (duel && (duel.status === 'in-progress' || duel.status === 'waiting')) {
                    const player = duel.players.find((p) => p.userId.toString() === userId.toString());
                    if (player && !player.leftAt) {
                      player.leftAt = new Date();
                      await duel.save();
                      logger.info(`[Socket.io] Set leftAt timestamp for disconnected user ${userId} in duel:${cleanCode}`);
                    }
                  }
                })
                .catch((err) => {
                  logger.warn(`[Socket.io] Could not set disconnect leftAt for duel ${cleanCode}: ${err.message}`);
                });
            }, 6000);

            this.pendingDuelDisconnects.set(key, { timer, roomCode: cleanCode, userId, name });
            logger.debug(`[Socket.io] Socket ${socketId} disconnected from duel:${cleanCode}. Started 6s grace period timer for user ${userId}.`);
          }
        }
      });

      // Disconnect handling
      socket.on('disconnect', (reason) => {
        const userId = socket.data.userId;
        if (userId) {
          this.untrackUserSocket(userId, socketId);
        }
        logger.debug(`[Socket.io] Socket ${socketId} disconnected (${reason})`);
      });
    });
  }

  private trackUserSocket(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private untrackUserSocket(userId: string, socketId: string): void {
    const set = this.userSockets.get(userId);
    if (set) {
      set.delete(socketId);
      if (set.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Get raw Socket.IO server instance
   */
  public getIO(): Server | null {
    return this.io;
  }

  /**
   * Send event directly to a specific user across all their connected devices/tabs
   */
  public sendToUser(userId: string, event: string, data: any): boolean {
    if (!this.io) return false;
    this.io.to(`user:${userId}`).emit(event, data);
    return true;
  }

  /**
   * Real-Time Notification push to a student or admin user
   */
  public emitNotification(userId: string, notification: any): boolean {
    if (!this.io) return false;
    this.io.to(`user:${userId}`).emit('notification:new', notification);
    logger.info(`[Socket.io] Emitted real-time notification to user ${userId}: "${notification?.title || 'Notification'}"`);
    return true;
  }

  /**
   * Broadcast updated contest leaderboard to all viewers in real-time
   */
  public emitLeaderboardUpdate(monthKey: string, leaderboard: any): boolean {
    if (!this.io) return false;
    const cleanKey = monthKey || 'active';
    this.io.to(`contest:${cleanKey}`).emit('contest:leaderboard_update', {
      monthKey: cleanKey,
      leaderboard,
      updatedAt: new Date().toISOString(),
    });
    // Also broadcast to active alias
    if (cleanKey !== 'active') {
      this.io.to('contest:active').emit('contest:leaderboard_update', {
        monthKey: cleanKey,
        leaderboard,
        updatedAt: new Date().toISOString(),
      });
    }
    logger.info(`[Socket.io] Broadcasted live contest leaderboard update (${leaderboard?.length || 0} entries) to contest:${cleanKey}`);
    return true;
  }

  /**
   * Broadcast live activity ticker (e.g. participant solved problem)
   */
  public broadcastContestActivity(monthKey: string, activity: {
    userName: string;
    avatar?: string;
    problemTitle?: string;
    problemSlug: string;
    difficulty?: string;
    pointsEarned?: number;
    timestamp?: string;
  }): boolean {
    if (!this.io) return false;
    const cleanKey = monthKey || 'active';
    const payload = {
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString(),
    };
    this.io.to(`contest:${cleanKey}`).emit('contest:activity', payload);
    if (cleanKey !== 'active') {
      this.io.to('contest:active').emit('contest:activity', payload);
    }
    return true;
  }

  /**
   * Broadcast to custom room
   */
  public broadcastToRoom(room: string, event: string, data: any): boolean {
    if (!this.io) return false;
    this.io.to(room).emit(event, data);
    return true;
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcastAll(event: string, data: any): boolean {
    if (!this.io) return false;
    this.io.emit(event, data);
    return true;
  }

  /**
   * Check if a specific user currently has an active socket connection
   */
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size || 0) > 0;
  }

  /**
   * Total number of connected online users
   */
  public getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}

export const socketService = SocketService.getInstance();
