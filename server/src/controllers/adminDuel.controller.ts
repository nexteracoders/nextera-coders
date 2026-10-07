import { Request, Response, NextFunction } from 'express';
import { CodeDuel } from '../models/codeDuel.model';
import { User } from '../models/user.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { PlatformSettings } from '../models/settings.model';
import { AuditLog } from '../models/auditLog.model';
import { socketService } from '../services/socket.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// @desc    Get all duels with metrics, filters, search & pagination
// @route   GET /api/admin/duels
// @access  Protected (Admin only)
export const getAdminDuels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const statusFilter = (req.query.status as string)?.trim();
    const difficultyFilter = (req.query.difficulty as string)?.trim();
    const search = (req.query.search as string)?.trim();

    const query: any = { duelType: { $ne: 'prime' } };

    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (difficultyFilter && difficultyFilter !== 'all') {
      query.difficulty = difficultyFilter;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { roomCode: searchRegex },
        { problemTitle: searchRegex },
        { 'players.name': searchRegex },
        { 'players.college': searchRegex },
      ];
    }

    // Parallel fetch: Paginated Duels, Total Match Count & High-Level System Metrics
    const [duels, totalFiltered, totalAll, inProgressCount, waitingCount, completedCount, timedOutCount, cancelledCount, coinsAggregate] =
      await Promise.all([
        CodeDuel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CodeDuel.countDocuments(query),
        CodeDuel.countDocuments(),
        CodeDuel.countDocuments({ status: 'in-progress' }),
        CodeDuel.countDocuments({ status: 'waiting' }),
        CodeDuel.countDocuments({ status: 'completed' }),
        CodeDuel.countDocuments({ status: 'timed-out' }),
        CodeDuel.countDocuments({ status: 'cancelled' }),
        CodeDuel.aggregate([
          { $match: { status: 'completed', winnerId: { $ne: null } } },
          { $group: { _id: null, totalCoins: { $sum: '$coinsReward' } } },
        ]),
      ]);

    const totalCoinsAwarded = coinsAggregate[0]?.totalCoins || 0;

    ApiResponse.success(res, 'Admin duels list retrieved successfully', {
      duels,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
      },
      metrics: {
        totalDuels: totalAll,
        inProgressDuels: inProgressCount,
        waitingDuels: waitingCount,
        completedDuels: completedCount,
        timedOutDuels: timedOutCount,
        cancelledDuels: cancelledCount,
        totalCoinsAwarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete details of a single duel (inspect code, stats, solution)
// @route   GET /api/admin/duels/:id
// @access  Protected (Admin only)
export const getAdminDuelById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Search by ObjectId or roomCode
    const duel = await CodeDuel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { roomCode: id.toUpperCase() }].filter(
        Boolean
      ),
    })
      .populate('problemId', 'title slug difficulty category description constraints examples')
      .populate('players.userId', 'name email profileImage college role points')
      .populate('winnerId', 'name email profileImage college')
      .lean();

    if (!duel) {
      throw ApiError.notFound(`Duel with ID/Room "${id}" not found`);
    }

    ApiResponse.success(res, 'Duel details retrieved', { duel });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin force-cancel / terminate an in-progress or waiting duel
// @route   POST /api/admin/duels/:id/cancel
// @access  Protected (Admin only)
export const cancelAdminDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by platform administrator' } = req.body;
    const adminUser = req.user!;

    const duel = await CodeDuel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { roomCode: id.toUpperCase() }].filter(
        Boolean
      ),
    });

    if (!duel) {
      throw ApiError.notFound('Duel battle not found');
    }

    if (duel.status === 'completed') {
      throw ApiError.badRequest('Cannot cancel a duel that has already completed successfully');
    }

    const prevStatus = duel.status;
    duel.status = 'cancelled';
    duel.winningReason = undefined;
    await duel.save();

    // Refund any coin stakes if players paid coins
    let totalRefunded = 0;
    for (const player of duel.players) {
      if (player.coinsPaid && player.coinsPaid > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { points: player.coinsPaid },
        });
        totalRefunded += player.coinsPaid;
        try {
          await PointTransaction.create({
            userId: player.userId,
            amount: player.coinsPaid,
            type: 'PRIME_DUEL_REFUND',
            referenceType: 'CodeDuel',
            referenceId: duel.roomCode,
            description: `Admin cancel refund for battle (${duel.roomCode})`,
          });
        } catch (txErr: any) {
          logger.warn(`PointTransaction error for admin cancel refund: ${txErr.message}`);
        }
      }
    }

    // Broadcast immediate termination to any connected sockets in the arena
    socketService.broadcastToRoom(`duel:${duel.roomCode}`, 'duel:game_over', {
      roomCode: duel.roomCode,
      status: 'cancelled',
      winnerId: null,
      winningReason: 'opponent_forfeit',
      message: reason,
      cancelledByAdmin: true,
    });

    // Record Immutable Admin Audit Log
    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'cancel',
        resourceType: 'CodeDuel',
        resourceId: duel._id.toString(),
        resourceTitle: `Room ${duel.roomCode} (${duel.problemTitle})`,
        details: {
          previousStatus: prevStatus,
          reason,
          players: duel.players.map((p) => ({ userId: p.userId, name: p.name })),
        },
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to create audit log for cancelled duel: ${auditErr.message}`);
    }

    logger.info(`[Admin] Cancelled Code Duel room: ${duel.roomCode} by ${adminUser.name}. Reason: ${reason}`);

    ApiResponse.success(res, 'Duel successfully cancelled and participants notified', { duel });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin permanently delete a duel battle record
// @route   DELETE /api/admin/duels/:id
// @access  Protected (Admin only)
export const deleteAdminDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const adminUser = req.user!;

    const duel = await CodeDuel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { roomCode: id.toUpperCase() }].filter(
        Boolean
      ),
    });

    if (!duel) {
      throw ApiError.notFound('Duel record not found');
    }

    const roomCode = duel.roomCode;
    const problemTitle = duel.problemTitle;
    await CodeDuel.deleteOne({ _id: duel._id });

    // Record Audit Log
    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'delete',
        resourceType: 'CodeDuel',
        resourceId: duel._id.toString(),
        resourceTitle: `Room ${roomCode} (${problemTitle})`,
        details: {
          roomCode,
          problemTitle,
          status: duel.status,
        },
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to log audit for duel deletion: ${auditErr.message}`);
    }

    logger.info(`[Admin] Deleted Code Duel record: ${roomCode} by ${adminUser.name}`);

    ApiResponse.success(res, `Duel record ${roomCode} deleted successfully`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Code Duel platform configurations
// @route   GET /api/admin/duels/settings
// @access  Protected (Admin only)
export const getAdminDuelSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    const duelSettings = settings.duelSettings || {
      coinsReward: 50,
      durationSeconds: 900,
      isEnabled: true,
      maxParticipantsPerRoom: 4,
    };

    ApiResponse.success(res, 'Code Duel settings retrieved', { settings: duelSettings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Code Duel platform configurations
// @route   PUT /api/admin/duels/settings
// @access  Protected (Admin only)
export const updateAdminDuelSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { coinsReward, durationSeconds, isEnabled, maxParticipantsPerRoom } = req.body;
    const adminUser = req.user!;

    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    if (!settings.duelSettings) {
      settings.duelSettings = {
        coinsReward: 50,
        durationSeconds: 900,
        isEnabled: true,
        maxParticipantsPerRoom: 4,
      };
    }

    if (typeof coinsReward === 'number' && coinsReward >= 0) {
      settings.duelSettings.coinsReward = coinsReward;
    }
    if (typeof durationSeconds === 'number' && durationSeconds >= 60) {
      settings.duelSettings.durationSeconds = durationSeconds;
    }
    if (typeof isEnabled === 'boolean') {
      settings.duelSettings.isEnabled = isEnabled;
    }
    if (typeof maxParticipantsPerRoom === 'number' && maxParticipantsPerRoom >= 2 && maxParticipantsPerRoom <= 10) {
      settings.duelSettings.maxParticipantsPerRoom = Math.floor(maxParticipantsPerRoom);
    }

    await settings.save();

    // Record Audit Log
    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'update',
        resourceType: 'Settings',
        resourceId: settings._id.toString(),
        resourceTitle: 'Code Duel Configurations',
        details: settings.duelSettings,
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to log audit for duel settings update: ${auditErr.message}`);
    }

    logger.info(`[Admin] Updated Code Duel settings: ${JSON.stringify(settings.duelSettings)} by ${adminUser.name}`);

    ApiResponse.success(res, 'Code Duel settings updated successfully', { settings: settings.duelSettings });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 👑 NEC PRIME BATTLE ADMIN CONTROLLERS
// ==========================================

// @desc    Get NEC Prime Battle platform configurations & rules
// @route   GET /api/admin/duels/prime/settings
// @access  Protected (Admin only)
export const getAdminPrimeDuelSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    const primeSettings = settings.primeDuelSettings || {
      minStake: 50,
      maxStake: 5000,
      platformFeePercent: 10,
      durationSeconds: 900,
      isEnabled: true,
      maxParticipantsPerRoom: 10,
      twoPlayerPercentages: { first: 100 },
      squadPercentages: { first: 65, second: 35 },
      grandRoyalePercentages: { first: 50, second: 30, third: 20 },
    };

    ApiResponse.success(res, 'NEC Prime Battle settings retrieved', { settings: primeSettings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update NEC Prime Battle platform configurations & rules
// @route   PUT /api/admin/duels/prime/settings
// @access  Protected (Admin only)
export const updateAdminPrimeDuelSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user!;
    const {
      minStake,
      maxStake,
      platformFeePercent,
      durationSeconds,
      isEnabled,
      maxParticipantsPerRoom,
      twoPlayerPercentages,
      squadPercentages,
      grandRoyalePercentages,
    } = req.body;

    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }

    if (!settings.primeDuelSettings) {
      settings.primeDuelSettings = {
        minStake: 50,
        maxStake: 5000,
        platformFeePercent: 10,
        durationSeconds: 900,
        isEnabled: true,
        maxParticipantsPerRoom: 10,
        twoPlayerPercentages: { first: 100 },
        squadPercentages: { first: 65, second: 35 },
        grandRoyalePercentages: { first: 50, second: 30, third: 20 },
      };
    }

    if (typeof minStake === 'number' && minStake >= 1) {
      settings.primeDuelSettings.minStake = Math.floor(minStake);
    }
    if (typeof maxStake === 'number' && maxStake >= (settings.primeDuelSettings.minStake || 50)) {
      settings.primeDuelSettings.maxStake = Math.floor(maxStake);
    }
    if (typeof platformFeePercent === 'number' && platformFeePercent >= 0 && platformFeePercent <= 50) {
      settings.primeDuelSettings.platformFeePercent = Math.round(platformFeePercent * 10) / 10;
    }
    if (typeof durationSeconds === 'number' && durationSeconds >= 60) {
      settings.primeDuelSettings.durationSeconds = Math.floor(durationSeconds);
    }
    if (typeof isEnabled === 'boolean') {
      settings.primeDuelSettings.isEnabled = isEnabled;
    }
    if (typeof maxParticipantsPerRoom === 'number' && maxParticipantsPerRoom >= 2 && maxParticipantsPerRoom <= 10) {
      settings.primeDuelSettings.maxParticipantsPerRoom = Math.floor(maxParticipantsPerRoom);
    }

    if (twoPlayerPercentages && typeof twoPlayerPercentages.first === 'number') {
      settings.primeDuelSettings.twoPlayerPercentages = {
        first: Math.max(0, Math.min(100, Math.floor(twoPlayerPercentages.first))),
      };
    }

    if (squadPercentages) {
      const first = typeof squadPercentages.first === 'number' ? Math.floor(squadPercentages.first) : 65;
      const second = typeof squadPercentages.second === 'number' ? Math.floor(squadPercentages.second) : 35;
      settings.primeDuelSettings.squadPercentages = { first, second };
    }

    if (grandRoyalePercentages) {
      const first = typeof grandRoyalePercentages.first === 'number' ? Math.floor(grandRoyalePercentages.first) : 50;
      const second = typeof grandRoyalePercentages.second === 'number' ? Math.floor(grandRoyalePercentages.second) : 30;
      const third = typeof grandRoyalePercentages.third === 'number' ? Math.floor(grandRoyalePercentages.third) : 20;
      settings.primeDuelSettings.grandRoyalePercentages = { first, second, third };
    }

    await settings.save();

    // Record Audit Log
    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'update',
        resourceType: 'Settings',
        resourceId: settings._id.toString(),
        resourceTitle: 'NEC Prime Battle Configurations',
        details: settings.primeDuelSettings,
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to log audit for prime duel settings update: ${auditErr.message}`);
    }

    logger.info(`[Admin] Updated NEC Prime Battle settings: ${JSON.stringify(settings.primeDuelSettings)} by ${adminUser.name}`);

    ApiResponse.success(res, 'NEC Prime Battle settings updated successfully', {
      settings: settings.primeDuelSettings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Prime Duels with metrics, platform fee earnings, search & pagination
// @route   GET /api/admin/duels/prime
// @access  Protected (Admin only)
export const getAdminPrimeDuels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 15));
    const skip = (page - 1) * limit;

    const statusFilter = (req.query.status as string)?.trim();
    const difficultyFilter = (req.query.difficulty as string)?.trim();
    const search = (req.query.search as string)?.trim();

    const query: any = { duelType: 'prime' };

    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (difficultyFilter && difficultyFilter !== 'all') {
      query.difficulty = difficultyFilter;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { roomCode: searchRegex },
        { problemTitle: searchRegex },
        { 'players.name': searchRegex },
        { 'players.college': searchRegex },
      ];
    }

    // Parallel fetch: Paginated Duels, Counts & Aggregations
    const [duels, totalFiltered, totalAll, inProgressCount, waitingCount, completedCount, cancelledCount, primeAggregate] =
      await Promise.all([
        CodeDuel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CodeDuel.countDocuments(query),
        CodeDuel.countDocuments({ duelType: 'prime' }),
        CodeDuel.countDocuments({ duelType: 'prime', status: 'in-progress' }),
        CodeDuel.countDocuments({ duelType: 'prime', status: 'waiting' }),
        CodeDuel.countDocuments({ duelType: 'prime', status: 'completed' }),
        CodeDuel.countDocuments({ duelType: 'prime', status: 'cancelled' }),
        CodeDuel.aggregate([
          { $match: { duelType: 'prime' } },
          {
            $group: {
              _id: null,
              totalGrossStaked: { $sum: '$totalPot' },
              totalPlatformRevenue: { $sum: '$platformFeeCollected' },
              totalPrizeDistributed: { $sum: '$netPrizePool' },
            },
          },
        ]),
      ]);

    const metrics = {
      totalPrimeDuels: totalAll,
      totalGrossStaked: primeAggregate[0]?.totalGrossStaked || 0,
      totalPlatformRevenue: primeAggregate[0]?.totalPlatformRevenue || 0, // 10% Platform Cut
      totalPrizeDistributed: primeAggregate[0]?.totalPrizeDistributed || 0,
      inProgressMatches: inProgressCount,
      waitingMatches: waitingCount,
      completedMatches: completedCount,
      cancelledMatches: cancelledCount,
    };

    ApiResponse.success(res, 'Admin Prime duels list retrieved successfully', {
      duels,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit) || 1,
        totalItems: totalFiltered,
      },
      metrics,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin Terminate & Refund a Prime Duel
// @route   POST /api/admin/duels/prime/:id/cancel-refund
// @access  Protected (Admin only)
export const cancelAndRefundPrimeDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUser = req.user!;
    const { id } = req.params;
    const { reason = 'Cancelled by administrator' } = req.body;

    const duel = await CodeDuel.findById(id);
    if (!duel) throw ApiError.notFound('Prime duel not found');

    if (duel.duelType !== 'prime') {
      throw ApiError.badRequest('Target duel is not a Prime battle');
    }

    if (duel.status === 'completed') {
      throw ApiError.badRequest('Cannot refund a completed battle that already concluded and distributed coins');
    }

    duel.status = 'cancelled';
    await duel.save();

    let totalRefunded = 0;
    for (const player of duel.players) {
      if (player.coinsPaid && player.coinsPaid > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { points: player.coinsPaid },
        });
        totalRefunded += player.coinsPaid;
        try {
          await PointTransaction.create({
            userId: player.userId,
            amount: player.coinsPaid,
            type: 'PRIME_DUEL_REFUND',
            referenceType: 'CodeDuel',
            referenceId: duel.roomCode,
            description: `Admin refund for Prime Battle (${duel.roomCode}): ${reason}`,
          });
        } catch (txErr: any) {
          logger.warn(`PointTransaction error for prime refund: ${txErr.message}`);
        }
        logger.info(`[Admin Refund] Returned ${player.coinsPaid} coins to ${player.name} (${player.userId}) for duel ${duel.roomCode}`);
      }
    }

    // Broadcast cancellation to room
    socketService.broadcastToRoom(`duel:${duel.roomCode}`, 'duel:game_over', {
      roomCode: duel.roomCode,
      status: 'cancelled',
      reason: `Battle aborted by admin: ${reason}. All coins refunded 100%!`,
      players: duel.players,
    });

    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'cancel',
        resourceType: 'CodeDuel',
        resourceId: duel._id.toString(),
        resourceTitle: `Refunded Prime Battle: ${duel.roomCode}`,
        details: { reason, totalRefunded, roomCode: duel.roomCode },
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to create audit log for prime duel refund: ${auditErr.message}`);
    }

    ApiResponse.success(res, `Prime battle cancelled and ${totalRefunded} total coins refunded to participants`, {
      duel,
      totalRefunded,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Override a player's anti-cheat status in a duel
// @route   POST /api/admin/duels/:id/players/:playerId/anticheat
// @access  Protected (Admin only)
export const overrideDuelPlayerAntiCheat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, playerId } = req.params;
    const { status, reason } = req.body;
    const adminUser = req.user!;

    if (!status || !['clean', 'suspicious', 'flagged', 'disqualified'].includes(status)) {
      throw ApiError.badRequest('Valid status (clean, suspicious, flagged, disqualified) is required');
    }

    const duel = await CodeDuel.findById(id);
    if (!duel) throw ApiError.notFound('Duel battle record not found');

    const player = duel.players.find(
      (p) => p.userId.toString() === playerId || (p as any)._id?.toString() === playerId
    );
    if (!player) throw ApiError.notFound('Player not found in this duel');

    if (!player.antiCheat) {
      player.antiCheat = {
        tabSwitchesCount: 0,
        pasteCount: 0,
        timeTakenSeconds: 0,
        status,
        reason: reason || `Admin updated status to ${status}`,
        logs: [],
        adminOverridden: true,
      };
    } else {
      player.antiCheat.status = status;
      player.antiCheat.reason = reason || `Admin updated status to ${status}`;
      player.antiCheat.adminOverridden = true;
    }

    await duel.save();

    try {
      await AuditLog.create({
        admin: adminUser._id,
        action: 'update',
        resourceType: 'CodeDuel',
        resourceId: duel._id.toString(),
        resourceTitle: `Anti-Cheat Override: ${player.name} in Duel ${duel.roomCode}`,
        details: { playerId, newStatus: status, reason },
      });
    } catch (auditErr: any) {
      logger.warn(`Failed to create audit log for duel anti-cheat override: ${auditErr.message}`);
    }

    ApiResponse.success(res, `Player anti-cheat status updated to ${status}`, {
      duel,
      player,
    });
  } catch (error) {
    next(error);
  }
};

