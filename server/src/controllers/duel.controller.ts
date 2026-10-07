import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CodeDuel } from '../models/codeDuel.model';
import { CodingProblem } from '../models/problem.model';
import { User } from '../models/user.model';
import { PlatformSettings } from '../models/settings.model';
import { PointTransaction } from '../models/pointTransaction.model';
import { codeExecutionService } from '../services/codeExecution/codeExecution.service';
import { socketService } from '../services/socket.service';
import { ApiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

// Helper: Generate room code in format: NEC + TeamSize + Random Letter (A-Z) + Random Number (1-1000)
// Example: NEC2K742, NEC3A519, NEC4M802
function generateRoomCode(teamSize: number = 2): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNum = Math.floor(Math.random() * 1000) + 1; // 1 to 1000
  return `NEC${teamSize}${randomLetter}${randomNum}`;
}

// Helper: Generate NEC Prime room code in format: PRIME + TeamSize + Random Letter (A-Z) + Random Number (1-1000)
// Example: PRIME2K742, PRIME3A519, PRIME5M802
function generatePrimeRoomCode(teamSize: number = 2): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomNum = Math.floor(Math.random() * 1000) + 1;
  return `PRIME${teamSize}${randomLetter}${randomNum}`;
}

// Helper: Calculate NEC Prime Coin Pot, Platform Cut, and Tiered Winner Distribution
export function calculatePrimeDistribution(
  entryFee: number,
  participantCount: number,
  config?: {
    platformFeePercent?: number;
    twoPlayerPercentages?: { first: number };
    squadPercentages?: { first: number; second: number };
    grandRoyalePercentages?: { first: number; second: number; third: number };
  }
) {
  const feePercent = typeof config?.platformFeePercent === 'number' ? config.platformFeePercent : 10;
  const totalPot = entryFee * participantCount;
  const platformFee = Math.round(totalPot * (feePercent / 100)); // Platform commission cut
  const netPool = totalPot - platformFee; // Net prize pool to be shared

  let distribution: Array<{ rank: number; percentage: number; coins: number }> = [];

  if (participantCount <= 2) {
    const p1 = config?.twoPlayerPercentages?.first ?? 100;
    distribution = [
      { rank: 1, percentage: p1, coins: Math.round(netPool * (p1 / 100)) }
    ];
  } else if (participantCount >= 3 && participantCount <= 5) {
    const p1 = config?.squadPercentages?.first ?? 65;
    const p2 = config?.squadPercentages?.second ?? 35;
    const firstCoins = Math.round(netPool * (p1 / 100));
    const secondCoins = netPool - firstCoins;
    distribution = [
      { rank: 1, percentage: p1, coins: firstCoins },
      { rank: 2, percentage: p2, coins: secondCoins },
    ];
  } else {
    const p1 = config?.grandRoyalePercentages?.first ?? 50;
    const p2 = config?.grandRoyalePercentages?.second ?? 30;
    const p3 = config?.grandRoyalePercentages?.third ?? 20;
    const firstCoins = Math.round(netPool * (p1 / 100));
    const secondCoins = Math.round(netPool * (p2 / 100));
    const thirdCoins = netPool - firstCoins - secondCoins;
    distribution = [
      { rank: 1, percentage: p1, coins: firstCoins },
      { rank: 2, percentage: p2, coins: secondCoins },
      { rank: 3, percentage: p3, coins: thirdCoins },
    ];
  }

  return {
    totalPot,
    platformFee,
    netPool,
    distribution,
  };
}

// Helper: Resolve duel match timeout (evaluates winners, distributes pots, refunds on draw)
export async function resolveDuelTimeout(duel: any, cleanCode: string): Promise<void> {
  if (duel.status !== 'in-progress') return;

  duel.status = 'timed-out';

  // Decide winner based on test cases passed across all competitors
  const sortedByScore = [...duel.players].sort(
    (a, b) => (b.testCasesPassed || 0) - (a.testCasesPassed || 0)
  );
  const topCompetitor = sortedByScore[0];
  const secondCompetitor = sortedByScore[1];

  const hasWinner =
    topCompetitor &&
    (topCompetitor.testCasesPassed || 0) > 0 &&
    (!secondCompetitor || (topCompetitor.testCasesPassed || 0) > (secondCompetitor.testCasesPassed || 0));

  if (hasWinner) {
    duel.winnerId = topCompetitor.userId;
    duel.winningReason = 'most_test_cases';
  } else {
    duel.winnerId = null;
    duel.winningReason = 'draw';
  }

  if (duel.duelType === 'prime') {
    if (hasWinner) {
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
          userId: topCompetitor.userId,
          name: topCompetitor.name,
          rank: 1,
          percentage: poolInfo.distribution[0]?.percentage || 100,
          coinsAwarded: winnerReward,
        },
      ];
      duel.coinsReward = winnerReward;
      duel.totalPot = poolInfo.totalPot;
      duel.platformFeeCollected = poolInfo.platformFee;
      duel.netPrizePool = poolInfo.netPool;

      await User.findByIdAndUpdate(topCompetitor.userId, {
        $inc: { points: winnerReward, totalPoints: winnerReward },
      });

      try {
        await PointTransaction.create({
          userId: topCompetitor.userId,
          amount: winnerReward,
          type: 'PRIME_DUEL_WIN',
          referenceType: 'CodeDuel',
          referenceId: duel.roomCode,
          description: `Victory on Timeout in Prime Battle (${duel.roomCode})`,
        });
      } catch (txErr: any) {
        logger.warn(`Failed to log PointTransaction for prime timeout win: ${txErr.message}`);
      }
    } else {
      // Draw in Prime Battle -> 100% refund all participants
      for (const player of duel.players) {
        if (player.coinsPaid && player.coinsPaid > 0) {
          await User.findByIdAndUpdate(player.userId, {
            $inc: { points: player.coinsPaid },
          });
          try {
            await PointTransaction.create({
              userId: player.userId,
              amount: player.coinsPaid,
              type: 'PRIME_DUEL_REFUND',
              referenceType: 'CodeDuel',
              referenceId: duel.roomCode,
              description: `Draw Refund for Prime Battle (${duel.roomCode})`,
            });
          } catch (txErr: any) {
            logger.warn(`Failed to log PointTransaction for prime refund: ${txErr.message}`);
          }
        }
      }
    }
  } else {
    // Standard Code Battle: 100% Free Practice (No coins awarded or deducted)
    duel.coinsReward = 0;
  }

  await duel.save();

  socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
    roomCode: duel.roomCode,
    status: duel.status,
    winnerId: duel.winnerId,
    winnerName: hasWinner ? topCompetitor.name : 'Draw',
    winningReason: duel.winningReason,
    players: duel.players,
    duelType: duel.duelType,
    coinsAwarded: duel.winnerId ? (duel.duelType === 'prime' ? duel.coinsReward : Math.round((duel.coinsReward || 50) / 2)) : 0,
  });
}

// Helper: Pick a random published DSA problem
async function pickRandomProblem(difficulty?: string) {
  const query: any = { isPublished: true, 'testCases.0': { $exists: true } };
  if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    query.difficulty = difficulty;
  }

  const count = await CodingProblem.countDocuments(query);
  if (count === 0) {
    // Fallback query without difficulty filter
    const fallbackCount = await CodingProblem.countDocuments({ isPublished: true });
    if (fallbackCount === 0) {
      throw ApiError.internal('No published coding problems found for live duels');
    }
    const rand = Math.floor(Math.random() * fallbackCount);
    return CodingProblem.findOne({ isPublished: true }).skip(rand);
  }

  const rand = Math.floor(Math.random() * count);
  return CodingProblem.findOne(query).skip(rand);
}

// Helper: Format complete problem data for live duel arenas & sockets
export function formatDuelProblemData(problem: any) {
  if (!problem) return null;
  return {
    id: problem._id,
    title: problem.title,
    slug: problem.slug,
    order: problem.order,
    description: problem.description,
    difficulty: problem.difficulty,
    category: problem.category,
    constraints: problem.constraints || [],
    examples: problem.examples || [],
    hints: problem.hints || [],
    starterCode: problem.starterCode || {},
    solution: problem.solution || '',
    sampleTestCases:
      problem.testCases && problem.testCases.length > 0
        ? problem.testCases.filter((tc: any) => !tc.hidden)
        : (problem.examples || []).map((ex: any) => ({
            input: ex.input,
            expectedOutput: ex.output,
            explanation: ex.explanation,
            hidden: false,
          })),
  };
}

// @desc    Create a new 1vs1 or Group Code Duel Room (Private or Public)
// @route   POST /api/duels/create
// @access  Protected (Student / User)
export const createDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { difficulty, isPrivate = false, maxParticipants, problemId } = req.body;

    // Check platform duel settings
    const settings = await PlatformSettings.findOne().lean();
    if (settings?.duelSettings && settings.duelSettings.isEnabled === false) {
      throw ApiError.badRequest('1vs1 Code Duels are currently paused for scheduled platform maintenance');
    }

    const coinsReward = 0; // Standard Code Battle is 100% Free - No coins
    const durationSeconds = settings?.duelSettings?.durationSeconds ?? 900;
    const adminMaxParticipants = settings?.duelSettings?.maxParticipantsPerRoom ?? 4;

    const requestedMax = typeof maxParticipants === 'number' ? Math.floor(maxParticipants) : 2;
    const finalMaxParticipants = Math.min(Math.max(requestedMax, 2), adminMaxParticipants);

    let problem: any = null;
    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      problem = await CodingProblem.findOne({ _id: problemId, isPublished: true });
    }
    if (!problem) {
      problem = await pickRandomProblem(difficulty);
    }
    if (!problem) {
      throw ApiError.notFound('Unable to assign problem for duel');
    }

    let roomCode = generateRoomCode(finalMaxParticipants);
    // Ensure uniqueness
    let exists = await CodeDuel.findOne({ roomCode });
    while (exists) {
      roomCode = generateRoomCode(finalMaxParticipants);
      exists = await CodeDuel.findOne({ roomCode });
    }

    const duel = await CodeDuel.create({
      roomCode,
      problemId: problem._id,
      problemTitle: problem.title,
      problemSlug: problem.slug,
      difficulty: problem.difficulty,
      players: [
        {
          userId: user._id,
          name: user.name,
          profileImage: user.profileImage || '',
          college: user.college || '',
          status: 'joined',
          testCasesPassed: 0,
          totalTestCases: problem.testCases?.length || 0,
        },
      ],
      maxParticipants: finalMaxParticipants,
      status: 'waiting',
      coinsReward,
      durationSeconds,
      isPrivate: Boolean(isPrivate),
    });

    logger.info(`[Code Duel] Room created: ${roomCode} (Max: ${finalMaxParticipants}) by ${user.name} (${user._id}) for problem: ${problem.title}`);

    ApiResponse.success(
      res,
      'Duel room created successfully',
      {
        roomCode: duel.roomCode,
        problemTitle: duel.problemTitle,
        problemSlug: duel.problemSlug,
        difficulty: duel.difficulty,
        status: duel.status,
        players: duel.players,
        maxParticipants: duel.maxParticipants,
        coinsReward: duel.coinsReward,
        durationSeconds: duel.durationSeconds,
        problem: formatDuelProblemData(problem),
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Join an existing Code Duel Room via Room Code (Supports Rejoin & Group Battles)
// @route   POST /api/duels/join
// @access  Protected (Student / User)
export const joinDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.body;

    if (!roomCode || typeof roomCode !== 'string') {
      throw ApiError.badRequest('Valid room code is required');
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const duel = await CodeDuel.findOne({ roomCode: cleanCode });

    if (!duel) {
      throw ApiError.notFound(`Duel room "${cleanCode}" not found`);
    }

    // 1. REJOIN CHECK: Is user ALREADY a registered player in this duel?
    const existingPlayer = duel.players.find(
      (p) => p.userId.toString() === user._id.toString()
    );

    if (existingPlayer) {
      existingPlayer.leftAt = undefined;
      if (duel.status === 'in-progress' && existingPlayer.status === 'forfeited') {
        existingPlayer.status = 'coding';
      }
      await duel.save();

      // Notify others in room that this player has returned
      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_rejoined', {
        roomCode: duel.roomCode,
        userId: user._id,
        name: user.name,
        players: duel.players,
      });

      const problem = await CodingProblem.findById(duel.problemId);
      ApiResponse.success(res, 'Rejoined duel room successfully', {
        duel,
        rejoined: true,
        problem: problem
          ? {
              id: problem._id,
              title: problem.title,
              slug: problem.slug,
              order: problem.order,
              description: problem.description,
              difficulty: problem.difficulty,
              category: problem.category,
              constraints: problem.constraints,
              examples: problem.examples,
              hints: problem.hints,
              starterCode: problem.starterCode,
              supportedLanguages: problem.supportedLanguages,
              sampleTestCases: (problem.testCases || []).filter((tc) => !tc.hidden),
            }
          : null,
      });
      return;
    }

    // 2. NEW PLAYER JOINING
    if (duel.status !== 'waiting') {
      throw ApiError.badRequest(`This battle room is ${duel.status} and cannot be joined`);
    }

    const maxCandidates = duel.maxParticipants || 2;
    if (duel.players.length >= maxCandidates) {
      throw ApiError.badRequest(`This battle room is already full (maximum ${maxCandidates} candidates allowed)`);
    }

    const problem = await CodingProblem.findById(duel.problemId);
    if (!problem) {
      throw ApiError.notFound('Assigned problem not found');
    }

    // Add player to the room
    duel.players.push({
      userId: user._id,
      name: user.name,
      profileImage: user.profileImage || '',
      college: user.college || '',
      status: 'joined',
      testCasesPassed: 0,
      totalTestCases: problem.testCases?.length || 0,
    });

    const isCapacityReached = duel.players.length >= maxCandidates;

    if (isCapacityReached) {
      // Room reached capacity -> Auto-start battle!
      duel.players.forEach((p) => {
        p.status = 'coding';
      });
      duel.status = 'in-progress';
      const now = new Date();
      duel.startedAt = now;
      duel.expiresAt = new Date(now.getTime() + duel.durationSeconds * 1000);

      await duel.save();

      // Broadcast real-time duel:start to all participants
      const fullProblemData = formatDuelProblemData(problem);
      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:start', {
        roomCode: duel.roomCode,
        startedAt: duel.startedAt,
        expiresAt: duel.expiresAt,
        durationSeconds: duel.durationSeconds,
        players: duel.players,
        maxParticipants: duel.maxParticipants,
        problem: fullProblemData,
      });

      logger.info(`[Code Duel] Started battle in room ${cleanCode} with ${duel.players.length} players`);

      ApiResponse.success(res, 'Joined duel and started battle', {
        roomCode: duel.roomCode,
        status: duel.status,
        duel,
        started: true,
        problem: fullProblemData,
      });
    } else {
      // Room still waiting for more players (e.g. 2 of 4 or 3 of 4)
      await duel.save();

      const newPlayerObj = {
        userId: user._id,
        name: user.name,
        profileImage: user.profileImage || '',
        college: user.college || '',
        status: 'joined',
        testCasesPassed: 0,
        submissionCount: 0,
      };

      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_joined', {
        roomCode: duel.roomCode,
        player: newPlayerObj,
        newPlayer: newPlayerObj,
        players: duel.players,
        totalPlayers: duel.players.length,
        playersCount: duel.players.length,
        maxParticipants: maxCandidates,
        duelStatus: duel.status,
      });

      ApiResponse.success(res, `Joined waiting lobby (${duel.players.length}/${maxCandidates} players joined)`, {
        roomCode: duel.roomCode,
        status: duel.status,
        duel,
        started: false,
        problem: null,
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Host starts the battle early before room capacity is reached (min 2 players)
// @route   POST /api/duels/:roomCode/start-now
// @access  Protected (Student / User)
export const startDuelNow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    // Verify caller is the room host (player 1)
    if (duel.players[0]?.userId?.toString() !== user._id.toString()) {
      throw ApiError.forbidden('Only the room creator / host can start the battle early');
    }

    if (duel.status !== 'waiting') {
      throw ApiError.badRequest(`Duel room is already ${duel.status}`);
    }

    if (duel.players.length < 2) {
      throw ApiError.badRequest('At least 2 candidates must join before starting the battle');
    }

    const problem = await CodingProblem.findById(duel.problemId);
    if (!problem) throw ApiError.notFound('Assigned problem not found');

    duel.players.forEach((p) => {
      p.status = 'coding';
    });
    duel.status = 'in-progress';
    const now = new Date();
    duel.startedAt = now;
    duel.expiresAt = new Date(now.getTime() + duel.durationSeconds * 1000);

    await duel.save();

    const problemData = formatDuelProblemData(problem);

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:start', {
      roomCode: duel.roomCode,
      startedAt: duel.startedAt,
      expiresAt: duel.expiresAt,
      durationSeconds: duel.durationSeconds,
      players: duel.players,
      maxParticipants: duel.maxParticipants,
      problem: problemData,
    });

    ApiResponse.success(res, 'Battle started successfully', {
      duel,
      problem: problemData,
      timeRemainingSeconds: duel.durationSeconds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Detect user's active battle (only if user left/disconnected within the last 2 minutes)
// @route   GET /api/duels/my-active
// @access  Protected (Student / User)
export const getMyActiveDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000); // 120,000 ms

    const candidateDuels = await CodeDuel.find({
      'players.userId': user._id,
      status: { $in: ['waiting', 'in-progress'] },
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: { $exists: false } },
        { expiresAt: null },
      ],
    }).sort({ createdAt: -1 });

    let activeDuel: any = null;
    let rejoinSecondsRemaining = 0;

    for (const duel of candidateDuels) {
      const myPlayer = duel.players.find((p) => p.userId.toString() === user._id.toString());
      if (!myPlayer) continue;

      // Rejoin button should ONLY show if the player actually left or disconnected,
      // and strictly within 2 minutes (120 seconds) of leaving!
      if (myPlayer.leftAt && new Date(myPlayer.leftAt) >= twoMinutesAgo) {
        const remainingMs = 120000 - (now.getTime() - new Date(myPlayer.leftAt).getTime());
        const remainingSec = Math.max(1, Math.floor(remainingMs / 1000));
        activeDuel = duel;
        rejoinSecondsRemaining = remainingSec;
        break;
      }
    }

    ApiResponse.success(res, 'Active duel query executed', {
      activeDuel: activeDuel || null,
      rejoinSecondsRemaining: activeDuel ? rejoinSecondsRemaining : 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record player left/forfeited from active battle room (starts 2-minute rejoin window)
// @route   POST /api/duels/:roomCode/leave
// @access  Protected (Student / User)
export const leaveDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    const player = duel.players.find((p) => p.userId.toString() === user._id.toString());
    if (player) {
      player.leftAt = new Date();
      if (duel.status === 'in-progress') {
        player.status = 'forfeited';

        // Check if only 1 active player remains in the match
        const activePlayers = duel.players.filter((p) => p.status !== 'forfeited');
        if (activePlayers.length === 1) {
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
              logger.warn(`PointTransaction error for forfeit win: ${txErr.message}`);
            }
          } else {
            // Standard Code Battle: 100% Free (No coins awarded or deducted)
            duel.coinsReward = 0;
          }

          socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
            roomCode: duel.roomCode,
            status: 'completed',
            winnerId: winner.userId,
            winnerName: winner.name,
            winningReason: 'opponent_forfeit',
            coinsAwarded: duel.coinsReward,
            winningPlayer: winner,
            players: duel.players,
            duelType: duel.duelType,
          });
        }
      } else if (duel.status === 'waiting') {
        const isHost = duel.players[0]?.userId?.toString() === user._id.toString();
        if (isHost || duel.players.length <= 1) {
          duel.status = 'cancelled';
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
                logger.warn(`PointTransaction error for cancel refund: ${txErr.message}`);
              }
            }
          }
          socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
            roomCode: duel.roomCode,
            status: 'cancelled',
            reason: 'Room cancelled by host',
            players: duel.players,
          });
        }
      }
      await duel.save();
    }

    ApiResponse.success(res, 'Player leave recorded successfully', { success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Join duel with NEC AI Bot (Grandmaster Problem Solver)
// @route   POST /api/duels/:roomCode/join-ai
// @access  Protected (Student / User)
export const joinAiDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    if (duel.duelType === 'prime') {
      throw ApiError.badRequest('NEC AI Bot cannot enter real-coin Prime wager battles. Prime battles are exclusively for real player competition.');
    }

    if (!duel.players.some((p) => p.userId.toString() === user._id.toString())) {
      throw ApiError.forbidden('Only room participants can request NEC AI to join');
    }

    if (duel.status === 'completed' || duel.status === 'cancelled') {
      throw ApiError.badRequest(`Cannot join AI: duel is already ${duel.status}`);
    }

    const problem = await CodingProblem.findById(duel.problemId);
    if (!problem) throw ApiError.notFound('Problem not found');

    // Check if AI is already in the room
    const hasAi = duel.players.some((p) => p.isAi || p.name.includes('NEC AI'));
    if (!hasAi) {
      const aiUserId = new mongoose.Types.ObjectId('0000000000000000000000a1');
      duel.players.push({
        userId: aiUserId,
        name: 'NEC AI (Grandmaster)',
        profileImage: '/images/ai_avatar.png',
        college: 'NextEra AI Research Lab',
        status: 'coding',
        testCasesPassed: 0,
        totalTestCases: problem.testCases?.length || 3,
        isAi: true,
      });
    }

    duel.players.forEach((p) => {
      p.status = 'coding';
    });
    duel.status = 'in-progress';
    const now = new Date();
    duel.startedAt = now;
    duel.expiresAt = new Date(now.getTime() + duel.durationSeconds * 1000);

    await duel.save();

    const problemData = formatDuelProblemData(problem);

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:start', {
      roomCode: duel.roomCode,
      startedAt: duel.startedAt,
      expiresAt: duel.expiresAt,
      durationSeconds: duel.durationSeconds,
      players: duel.players,
      maxParticipants: duel.maxParticipants,
      problem: problemData,
    });

    ApiResponse.success(res, 'NEC AI Challenger has entered the arena! Battle started.', {
      duel,
      problem: problemData,
      timeRemainingSeconds: duel.durationSeconds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick Match: Instantly find a waiting player or create a public match
// @route   POST /api/duels/quick-match
// @access  Protected (Student / User)
export const quickMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { difficulty } = req.body;

    // Look for active waiting duel created within last 10 minutes (not stale/abandoned)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const query: any = {
      status: 'waiting',
      isPrivate: false,
      duelType: { $ne: 'prime' },
      'players.0.userId': { $ne: user._id },
      createdAt: { $gte: tenMinutesAgo },
    };
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    const availableDuel = await CodeDuel.findOne(query).sort({ createdAt: -1 });

    if (availableDuel) {
      // Join this duel!
      req.body.roomCode = availableDuel.roomCode;
      return joinDuelRoom(req, res, next);
    }

    // Check if user already has an active waiting room
    const myWaiting = await CodeDuel.findOne({
      status: 'waiting',
      duelType: { $ne: 'prime' },
      'players.0.userId': user._id,
      isPrivate: false,
    });

    if (myWaiting) {
      if (myWaiting.createdAt < tenMinutesAgo) {
        myWaiting.status = 'cancelled';
        await myWaiting.save();
      } else {
        ApiResponse.success(res, 'Waiting for an opponent to join', {
          roomCode: myWaiting.roomCode,
          status: 'waiting',
          duel: myWaiting,
        });
        return;
      }
    }

    // Create a new public waiting room
    req.body.isPrivate = false;
    return createDuelRoom(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Get live status of a Duel room + problem info
// @route   GET /api/duels/:roomCode
// @access  Protected (Student / User)
export const getDuelDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) {
      throw ApiError.notFound(`Duel room "${cleanCode}" not found`);
    }

    // Check timeout if in-progress
    if (duel.status === 'in-progress' && duel.expiresAt && new Date() > duel.expiresAt) {
      await resolveDuelTimeout(duel, cleanCode);
    }

    const problem = await CodingProblem.findById(duel.problemId);

    const now = Date.now();
    const expiresMs = duel.expiresAt ? new Date(duel.expiresAt).getTime() : now;
    const timeRemainingSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));

    ApiResponse.success(res, 'Duel details retrieved', {
      duel,
      timeRemainingSeconds,
      problem: formatDuelProblemData(problem),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit Code for Duel Evaluation (Instant Race Condition Check)
// @route   POST /api/duels/:roomCode/submit
// @access  Protected (Student / User)
export const submitDuelSolution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const { code, language, antiCheat } = req.body;

    if (!code || code.trim() === '') {
      throw ApiError.badRequest('Code cannot be empty');
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const duel = await CodeDuel.findOne({ roomCode: cleanCode });

    if (!duel) {
      throw ApiError.notFound(`Duel room "${cleanCode}" not found`);
    }

    if (duel.status !== 'in-progress') {
      throw ApiError.badRequest(`Cannot submit code: duel is ${duel.status}`);
    }

    // Check timer expiration
    if (duel.expiresAt && new Date() > duel.expiresAt) {
      duel.status = 'timed-out';
      await duel.save();
      throw ApiError.badRequest('Time has expired for this duel battle!');
    }

    const playerIndex = duel.players.findIndex((p) => p.userId.toString() === user._id.toString());
    if (playerIndex === -1) {
      throw ApiError.forbidden('You are not a registered participant in this duel');
    }

    const problem = await CodingProblem.findById(duel.problemId);
    if (!problem || !problem.testCases || problem.testCases.length === 0) {
      throw ApiError.internal('Problem test cases unavailable for duel evaluation');
    }

    // Evaluate solution against ALL problem test cases (including hidden)
    const evaluation = await codeExecutionService.evaluateSubmission(
      language || 'javascript',
      code,
      problem.testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        hidden: tc.hidden,
      }))
    );

    // Update player's duel stats
    const player = duel.players[playerIndex];
    player.testCasesPassed = evaluation.testCasesPassed;
    player.totalTestCases = evaluation.totalTestCases;
    player.submittedCode = code;
    player.submittedLanguage = language;
    player.submittedAt = new Date();
    player.executionTime = evaluation.executionTime;

    // Attach & compute anti-cheat telemetry
    if (antiCheat) {
      const tabSwitches = Number(antiCheat.tabSwitchesCount) || 0;
      const pastes = Number(antiCheat.pasteCount) || 0;
      const timeTaken = Number(antiCheat.timeTakenSeconds) || 0;

      let status: 'clean' | 'suspicious' | 'flagged' | 'disqualified' = 'clean';
      let reason = 'Normal coding pattern detected';

      if (tabSwitches >= 6 || pastes >= 6) {
        status = 'flagged';
        reason = `High violation detected: ${tabSwitches} tab switches, ${pastes} pastes`;
      } else if (tabSwitches >= 3 || pastes >= 3) {
        status = 'suspicious';
        reason = `Suspicious pattern: ${tabSwitches} tab switches, ${pastes} pastes`;
      } else if (timeTaken > 0 && timeTaken < 10) {
        status = 'flagged';
        reason = `Impossible solve time: ${timeTaken} seconds`;
      }

      player.antiCheat = {
        tabSwitchesCount: tabSwitches,
        pasteCount: pastes,
        timeTakenSeconds: timeTaken,
        status,
        reason,
        logs: Array.isArray(antiCheat.logs) ? antiCheat.logs.slice(-50) : [],
        adminOverridden: false,
      };
    }

    // Check if player passed 100% of test cases!
    const allPassed = evaluation.status === 'Accepted' || evaluation.testCasesPassed === evaluation.totalTestCases;

    if (allPassed && duel.status === 'in-progress') {
      // 🏆 THIS PLAYER WINS THE BATTLE!
      player.status = 'submitted';
      duel.status = 'completed';
      duel.winnerId = user._id;
      duel.winningReason = 'solved_first';

      if (duel.duelType === 'prime') {
        // PRIME BATTLE PAYOUT: Tiered Winner Distribution with Dynamic Platform Commission
        const settings = await PlatformSettings.findOne().lean();
        const primeConfig = settings?.primeDuelSettings;
        const participantCount = duel.players.length;
        const poolInfo = calculatePrimeDistribution(duel.entryFee, participantCount, {
          platformFeePercent: duel.platformFeePercent || primeConfig?.platformFeePercent || 10,
          twoPlayerPercentages: primeConfig?.twoPlayerPercentages,
          squadPercentages: primeConfig?.squadPercentages,
          grandRoyalePercentages: primeConfig?.grandRoyalePercentages,
        });

        // Sort players: 1st is the solver, rest sorted by testCasesPassed descending
        const otherPlayers = duel.players
          .filter((p) => p.userId.toString() !== user._id.toString())
          .sort((a, b) => (b.testCasesPassed || 0) - (a.testCasesPassed || 0));

        const rankedPlayers = [player, ...otherPlayers];
        const winnersList: Array<{ userId: any; name: string; rank: number; percentage: number; coinsAwarded: number }> = [];

        for (const tier of poolInfo.distribution) {
          const rankedPlayer = rankedPlayers[tier.rank - 1];
          if (rankedPlayer) {
            winnersList.push({
              userId: rankedPlayer.userId,
              name: rankedPlayer.name,
              rank: tier.rank,
              percentage: tier.percentage,
              coinsAwarded: tier.coins,
            });

            // Credit coins to winner's wallet
            await User.findByIdAndUpdate(rankedPlayer.userId, {
              $inc: { points: tier.coins, totalPoints: tier.coins },
            });
            try {
              await PointTransaction.create({
                userId: rankedPlayer.userId,
                amount: tier.coins,
                type: 'PRIME_DUEL_WIN',
                referenceType: 'CodeDuel',
                referenceId: duel.roomCode,
                description: `Rank #${tier.rank} prize in Prime Battle (${duel.roomCode})`,
              });
            } catch (txErr: any) {
              logger.warn(`PointTransaction error for prime winner: ${txErr.message}`);
            }
            logger.info(`[NEC Prime Duel] 👑 Awarded ${tier.coins} coins (${tier.percentage}%) to Rank #${tier.rank}: ${rankedPlayer.name} (${rankedPlayer.userId})`);
          }
        }

        duel.primeWinners = winnersList;
        duel.coinsReward = winnersList[0]?.coinsAwarded || poolInfo.netPool;
        duel.totalPot = poolInfo.totalPot;
        duel.platformFeeCollected = poolInfo.platformFee;
        duel.netPrizePool = poolInfo.netPool;
      } else {
        // STANDARD BATTLE: 100% Free Practice (No coins awarded or deducted)
        duel.coinsReward = 0;
        logger.info(`[Code Duel] Standard Battle won by: ${user.name} (${user._id}) (Free battle - 0 coins)`);
      }

      await duel.save();

      // Emit real-time game-over event to all players
      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
        roomCode: duel.roomCode,
        status: 'completed',
        winnerId: user._id,
        winnerName: user.name,
        winningReason: 'solved_first',
        coinsAwarded: duel.coinsReward,
        winningPlayer: player,
        players: duel.players,
        duelType: duel.duelType,
        primeWinners: duel.primeWinners,
        totalPot: duel.totalPot,
        netPrizePool: duel.netPrizePool,
        platformFeeCollected: duel.platformFeeCollected,
      });

      logger.info(`[Code Duel] 🏆 VICTORY in room ${cleanCode}! Winner: ${user.name}`);
    } else {
      player.status = 'coding';
      await duel.save();

      // Emit opponent progress update to other player
      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_progress', {
        roomCode: duel.roomCode,
        userId: user._id,
        name: user.name,
        testCasesPassed: evaluation.testCasesPassed,
        totalTestCases: evaluation.totalTestCases,
        allPassed: false,
      });
    }

    const myPrimeWin = duel.primeWinners?.find((w) => w.userId.toString() === user._id.toString());
    const isWinner = duel.winnerId?.toString() === user._id.toString() || Boolean(myPrimeWin);
    const coinsAwarded = myPrimeWin ? myPrimeWin.coinsAwarded : (duel.winnerId?.toString() === user._id.toString() ? duel.coinsReward : 0);

    ApiResponse.success(res, 'Solution evaluated', {
      evaluation,
      allPassed,
      duelStatus: duel.status,
      winnerId: duel.winnerId,
      isWinner,
      coinsAwarded,
      primeWinners: duel.primeWinners,
      duelType: duel.duelType,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run code against sample test cases (Safe test runner for duels, does NOT mark complete)
// @route   POST /api/duels/:roomCode/run-tests
// @access  Protected (Student / User)
export const runDuelTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const { code, language } = req.body;

    if (!code || code.trim() === '') {
      throw ApiError.badRequest('Code cannot be empty');
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const duel = await CodeDuel.findOne({ roomCode: cleanCode });

    if (!duel) {
      throw ApiError.notFound(`Duel room "${cleanCode}" not found`);
    }

    const isParticipant = duel.players.some((p) => p.userId.toString() === user._id.toString());
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a registered participant in this duel');
    }

    const problem = await CodingProblem.findById(duel.problemId);
    if (!problem) {
      throw ApiError.notFound('Problem not found');
    }

    // Use sample / visible test cases, or fallback to first 3 test cases if none are marked non-hidden
    let sampleCases = (problem.testCases || []).filter((tc) => !tc.hidden);
    if (sampleCases.length === 0 && problem.testCases && problem.testCases.length > 0) {
      sampleCases = problem.testCases.slice(0, 3).map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        hidden: false,
      }));
    }

    if (sampleCases.length === 0) {
      throw ApiError.badRequest('No sample test cases available to test');
    }

    const evaluation = await codeExecutionService.evaluateSubmission(
      language || 'javascript',
      code,
      sampleCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        hidden: false,
      }))
    );

    // Save draft code and update passed test cases count so opponent and post-battle inspection show real code
    const player = duel.players.find((p) => p.userId.toString() === user._id.toString());
    if (player) {
      player.submittedCode = code;
      player.submittedLanguage = language || 'javascript';
      player.testCasesPassed = Math.max(player.testCasesPassed || 0, evaluation.testCasesPassed || 0);
      await duel.save();
    }

    // Broadcast non-blocking test case progress to competitors so radar reflects test activity
    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_progress', {
      roomCode: duel.roomCode,
      userId: user._id,
      name: user.name,
      testCasesPassed: evaluation.testCasesPassed,
      totalTestCases: evaluation.totalTestCases,
    });

    ApiResponse.success(res, 'Test cases executed successfully', {
      evaluation,
      allPassed: evaluation.status === 'Accepted' || evaluation.testCasesPassed === evaluation.totalTestCases,
      roomCode: duel.roomCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete duel when Grandmaster AI finishes problem first
// @route   POST /api/duels/:roomCode/ai-win
// @access  Protected (Student / User)
export const completeAiDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    if (duel.status !== 'in-progress') {
      ApiResponse.success(res, 'Duel already finished', { duel });
      return;
    }

    const aiPlayer = duel.players.find((p) => p.isAi || p.name.includes('NEC AI'));
    if (!aiPlayer) {
      throw ApiError.badRequest('No AI participant in this duel');
    }

    duel.status = 'completed';
    duel.winnerId = aiPlayer.userId;
    duel.winningReason = 'solved_first';
    aiPlayer.status = 'submitted';
    aiPlayer.testCasesPassed = aiPlayer.totalTestCases || 3;

    await duel.save();

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
      roomCode: duel.roomCode,
      status: 'completed',
      winnerId: aiPlayer.userId,
      winnerName: aiPlayer.name,
      winningReason: 'solved_first',
      coinsAwarded: 0,
      winningPlayer: aiPlayer,
      players: duel.players,
      duelType: duel.duelType,
    });

    ApiResponse.success(res, 'AI victory recorded', { duel });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's personal Code Duel battle stats
// @route   GET /api/duels/user/stats
// @access  Protected (Student / User)
export const getMyDuelStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const duels = await CodeDuel.find({
      duelType: { $ne: 'prime' },
      'players.userId': user._id,
      status: { $in: ['completed', 'timed-out'] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalMatches = await CodeDuel.countDocuments({
      duelType: { $ne: 'prime' },
      'players.userId': user._id,
      status: { $in: ['completed', 'timed-out'] },
    });

    const wins = await CodeDuel.countDocuments({
      duelType: { $ne: 'prime' },
      winnerId: user._id,
      status: { $in: ['completed', 'timed-out'] },
    });

    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
    const totalCoinsWon = wins * 50;

    const settings = await PlatformSettings.findOne();
    const maxParticipantsPerRoom = settings?.duelSettings?.maxParticipantsPerRoom ?? 4;

    ApiResponse.success(res, 'User duel stats retrieved', {
      totalMatches,
      wins,
      losses,
      winRate,
      totalCoinsWon,
      maxParticipantsPerRoom,
      recentDuels: duels.map((d) => {
        const isWinner = d.winnerId?.toString() === user._id.toString();
        const opponent = d.players.find((p) => p.userId.toString() !== user._id.toString());
        return {
          id: d._id,
          roomCode: d.roomCode,
          problemTitle: d.problemTitle,
          difficulty: d.difficulty,
          isWinner,
          opponentName: opponent?.name || 'Challenger',
          opponentAvatar: opponent?.profileImage,
          coinsAwarded: isWinner ? d.coinsReward : 0,
          date: d.createdAt,
          status: d.status,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 👑 NEC PRIME BATTLE CONTROLLER METHODS
// ==========================================

// @desc    Create a new NEC Prime Battle Room (Staked Coins)
// @route   POST /api/duels/prime/create
// @access  Protected (Student / User)
export const createPrimeDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { difficulty, isPrivate = false, maxParticipants, problemId, entryFee } = req.body;

    const parsedEntryFee = Math.max(50, parseInt(entryFee, 10) || 50);

    // Verify creator has enough coins
    const currentUser = await User.findById(user._id);
    if (!currentUser || (currentUser.points || 0) < parsedEntryFee) {
      throw ApiError.badRequest(
        `Insufficient NEC Coins! You have ${currentUser?.points || 0} coins, but ${parsedEntryFee} coins are required to create this Prime Battle.`
      );
    }

    // Check platform prime duel settings
    const settings = await PlatformSettings.findOne().lean();
    const primeConfig = settings?.primeDuelSettings;
    if (primeConfig && primeConfig.isEnabled === false) {
      throw ApiError.badRequest('NEC Prime Battles are currently paused by administrator');
    }

    const minStake = primeConfig?.minStake || 50;
    const maxStake = primeConfig?.maxStake || 5000;
    if (parsedEntryFee < minStake) {
      throw ApiError.badRequest(`Minimum required stake is ${minStake} NEC Coins`);
    }
    if (parsedEntryFee > maxStake) {
      throw ApiError.badRequest(`Maximum allowed stake is ${maxStake} NEC Coins`);
    }

    const durationSeconds = primeConfig?.durationSeconds ?? 900;
    const adminMaxParticipants = primeConfig?.maxParticipantsPerRoom ?? 10;
    const teamSize = Math.max(2, Math.min(adminMaxParticipants, parseInt(maxParticipants, 10) || 2));

    // Deduct entry fee from creator's wallet
    currentUser.points = (currentUser.points || 0) - parsedEntryFee;
    await currentUser.save();

    let problem: any = null;
    if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
      problem = await CodingProblem.findById(problemId);
    }
    if (!problem) {
      problem = await pickRandomProblem(difficulty);
    }
    if (!problem) {
      // Refund creator if problem fetch fails
      currentUser.points = (currentUser.points || 0) + parsedEntryFee;
      await currentUser.save();
      throw ApiError.notFound('No problem found to launch the duel room');
    }

    // Calculate initial prize pool using dynamic config
    const poolInfo = calculatePrimeDistribution(parsedEntryFee, teamSize, primeConfig);

    // Unique Room Code
    let roomCode = generatePrimeRoomCode(teamSize);
    let exists = await CodeDuel.findOne({ roomCode });
    while (exists) {
      roomCode = generatePrimeRoomCode(teamSize);
      exists = await CodeDuel.findOne({ roomCode });
    }

    const duel = await CodeDuel.create({
      roomCode,
      duelType: 'prime',
      problemId: problem._id,
      problemTitle: problem.title,
      problemSlug: problem.slug,
      difficulty: problem.difficulty,
      players: [
        {
          userId: user._id,
          name: user.name,
          profileImage: user.profileImage || '',
          college: user.college || '',
          status: 'joined',
          testCasesPassed: 0,
          totalTestCases: problem.testCases?.length || 3,
          coinsPaid: parsedEntryFee,
        },
      ],
      maxParticipants: teamSize,
      status: 'waiting',
      entryFee: parsedEntryFee,
      totalPot: parsedEntryFee,
      platformFeePercent: 10,
      platformFeeCollected: poolInfo.platformFee,
      netPrizePool: poolInfo.netPool,
      coinsReward: poolInfo.netPool,
      durationSeconds,
      isPrivate: Boolean(isPrivate),
    });

    logger.info(`[NEC Prime Duel] Created room ${roomCode} by ${user.name} (Stake: ${parsedEntryFee} coins, Pot: ${poolInfo.totalPot})`);

    ApiResponse.success(
      res,
      'NEC Prime Battle room created successfully',
      {
        roomCode: duel.roomCode,
        duel,
        problem: formatDuelProblemData(problem),
        poolInfo,
        remainingCoins: currentUser.points,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Join an existing NEC Prime Battle Room (Validating & Staking Coins)
// @route   POST /api/duels/prime/join
// @access  Protected (Student / User)
export const joinPrimeDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.body;

    if (!roomCode || typeof roomCode !== 'string') {
      throw ApiError.badRequest('Valid room code is required');
    }

    const cleanCode = roomCode.trim().toUpperCase();
    const duel = await CodeDuel.findOne({ roomCode: cleanCode });

    if (!duel) {
      throw ApiError.notFound(`Prime battle room "${cleanCode}" not found`);
    }

    if (duel.duelType !== 'prime') {
      throw ApiError.badRequest(`Room "${cleanCode}" is a standard battle room, not a Prime battle.`);
    }

    const existingPlayer = duel.players.find(
      (p) => p.userId.toString() === user._id.toString()
    );

    // If rejoining an in-progress or waiting room they already paid for
    if (existingPlayer) {
      existingPlayer.leftAt = undefined;
      if (duel.status === 'in-progress' && existingPlayer.status === 'forfeited') {
        existingPlayer.status = 'coding';
      }
      await duel.save();

      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_rejoined', {
        roomCode: duel.roomCode,
        userId: user._id,
        name: user.name,
        players: duel.players,
      });

      const problem = await CodingProblem.findById(duel.problemId);
      const fullProblemData = formatDuelProblemData(problem);
      ApiResponse.success(res, 'Rejoined Prime Battle room successfully', {
        duel,
        rejoined: true,
        problem: fullProblemData,
      });
      return;
    }

    // New joiner checks
    if (duel.status !== 'waiting') {
      throw ApiError.badRequest('This Prime battle has already started or concluded');
    }

    const maxParticipants = duel.maxParticipants || 2;
    if (duel.players.length >= maxParticipants) {
      throw ApiError.badRequest(`This Prime battle room is full (Max ${maxParticipants} players)`);
    }

    // Check user has enough coins to pay the entryFee
    const currentUser = await User.findById(user._id);
    if (!currentUser || (currentUser.points || 0) < duel.entryFee) {
      throw ApiError.badRequest(
        `Insufficient NEC Coins! Entry stake is ${duel.entryFee} coins, but your wallet balance is ${currentUser?.points || 0} coins.`
      );
    }

    // Deduct entry fee
    currentUser.points = (currentUser.points || 0) - duel.entryFee;
    await currentUser.save();
    try {
      await PointTransaction.create({
        userId: user._id,
        amount: -duel.entryFee,
        type: 'PRIME_DUEL_ENTRY',
        referenceType: 'CodeDuel',
        referenceId: duel.roomCode,
        description: `Entry stake for Prime Battle (${duel.roomCode})`,
      });
    } catch (txErr: any) {
      logger.warn(`PointTransaction error for prime entry: ${txErr.message}`);
    }

    const problem = await CodingProblem.findById(duel.problemId);
    const fullProblemData = formatDuelProblemData(problem);

    // Add player to duel
    const joinedPlayer = {
      userId: user._id as any,
      name: user.name,
      profileImage: user.profileImage || '',
      college: user.college || '',
      status: 'joined' as const,
      testCasesPassed: 0,
      totalTestCases: problem?.testCases?.length || 3,
      coinsPaid: duel.entryFee,
    };
    duel.players.push(joinedPlayer);

    // Recalculate total pot
    const currentCount = duel.players.length;
    const poolInfo = calculatePrimeDistribution(duel.entryFee, maxParticipants);
    duel.totalPot = duel.entryFee * currentCount;
    duel.platformFeeCollected = Math.round(duel.totalPot * 0.10);
    duel.netPrizePool = duel.totalPot - duel.platformFeeCollected;

    // Check if room is now full and ready to start
    if (duel.players.length >= maxParticipants) {
      duel.status = 'in-progress';
      duel.startedAt = new Date();
      duel.expiresAt = new Date(Date.now() + (duel.durationSeconds || 900) * 1000);
      duel.players.forEach((p) => {
        p.status = 'coding';
      });
    }

    await duel.save();

    // Broadcast to room
    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:player_joined', {
      roomCode: duel.roomCode,
      player: joinedPlayer,
      newPlayer: joinedPlayer,
      totalPlayers: duel.players.length,
      playersCount: duel.players.length,
      maxParticipants: duel.maxParticipants,
      duelStatus: duel.status,
      players: duel.players,
      totalPot: duel.totalPot,
      netPrizePool: duel.netPrizePool,
    });

    if (duel.status === 'in-progress') {
      socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:start', {
        roomCode: duel.roomCode,
        problem: fullProblemData,
        durationSeconds: duel.durationSeconds,
        players: duel.players,
        startedAt: duel.startedAt,
        expiresAt: duel.expiresAt,
        totalPot: duel.totalPot,
        netPrizePool: duel.netPrizePool,
        primeDistribution: poolInfo.distribution,
      });
    }

    logger.info(`[NEC Prime Duel] User ${user.name} joined room ${cleanCode}. Staked ${duel.entryFee} coins. Status: ${duel.status}`);

    ApiResponse.success(res, 'Joined NEC Prime battle successfully', {
      roomCode: duel.roomCode,
      status: duel.status,
      started: duel.status === 'in-progress',
      duel,
      problem: fullProblemData,
      remainingCoins: currentUser.points,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick Match: Find or create a public NEC Prime Battle room
// @route   POST /api/duels/prime/quick-match
// @access  Protected (Student / User)
export const quickMatchPrime = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { difficulty, entryFee = 50, maxParticipants = 2 } = req.body;
    const parsedEntryFee = Math.max(50, parseInt(entryFee, 10) || 50);
    const parsedMaxParticipants = Math.min(8, Math.max(2, parseInt(maxParticipants, 10) || 2));

    const currentUser = await User.findById(user._id);
    if (!currentUser || (currentUser.points || 0) < parsedEntryFee) {
      throw ApiError.badRequest(
        `Insufficient NEC Coins! You have ${currentUser?.points || 0} coins, but ${parsedEntryFee} coins are required.`
      );
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const query: any = {
      duelType: 'prime',
      status: 'waiting',
      isPrivate: false,
      entryFee: parsedEntryFee,
      maxParticipants: parsedMaxParticipants,
      'players.userId': { $ne: user._id },
      createdAt: { $gte: tenMinutesAgo },
    };
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.difficulty = difficulty;
    }

    const availableDuel = await CodeDuel.findOne(query).sort({ createdAt: -1 });

    if (availableDuel) {
      // Deduct coins & join available duel
      currentUser.points = (currentUser.points || 0) - parsedEntryFee;
      await currentUser.save();
      try {
        await PointTransaction.create({
          userId: user._id,
          amount: -parsedEntryFee,
          type: 'PRIME_DUEL_ENTRY',
          referenceType: 'CodeDuel',
          referenceId: availableDuel.roomCode,
          description: `Entry stake for Prime Battle (${availableDuel.roomCode})`,
        });
      } catch (txErr: any) {
        logger.warn(`PointTransaction error in quickMatchPrime: ${txErr.message}`);
      }

      const problem = await CodingProblem.findById(availableDuel.problemId);
      const joinedPlayer = {
        userId: user._id as any,
        name: user.name,
        profileImage: user.profileImage || '',
        college: user.college || '',
        status: 'joined' as const,
        testCasesPassed: 0,
        totalTestCases: problem?.testCases?.length || 3,
        coinsPaid: parsedEntryFee,
      };
      availableDuel.players.push(joinedPlayer);

      const maxParticipantsCount = availableDuel.maxParticipants || parsedMaxParticipants;
      availableDuel.totalPot = availableDuel.entryFee * availableDuel.players.length;
      availableDuel.platformFeeCollected = Math.round(availableDuel.totalPot * 0.10);
      availableDuel.netPrizePool = availableDuel.totalPot - availableDuel.platformFeeCollected;

      if (availableDuel.players.length >= maxParticipantsCount) {
        availableDuel.status = 'in-progress';
        availableDuel.startedAt = new Date();
        availableDuel.expiresAt = new Date(Date.now() + (availableDuel.durationSeconds || 900) * 1000);
        availableDuel.players.forEach((p) => {
          p.status = 'coding';
        });
      }

      await availableDuel.save();

      socketService.broadcastToRoom(`duel:${availableDuel.roomCode}`, 'duel:player_joined', {
        roomCode: availableDuel.roomCode,
        player: joinedPlayer,
        newPlayer: joinedPlayer,
        totalPlayers: availableDuel.players.length,
        playersCount: availableDuel.players.length,
        maxParticipants: availableDuel.maxParticipants,
        duelStatus: availableDuel.status,
        players: availableDuel.players,
        totalPot: availableDuel.totalPot,
        netPrizePool: availableDuel.netPrizePool,
      });

      const fullProblemData = formatDuelProblemData(problem);

      if (availableDuel.status === 'in-progress') {
        const poolInfo = calculatePrimeDistribution(availableDuel.entryFee, maxParticipantsCount);
        socketService.broadcastToRoom(`duel:${availableDuel.roomCode}`, 'duel:start', {
          roomCode: availableDuel.roomCode,
          problem: fullProblemData,
          durationSeconds: availableDuel.durationSeconds,
          players: availableDuel.players,
          startedAt: availableDuel.startedAt,
          expiresAt: availableDuel.expiresAt,
          totalPot: availableDuel.totalPot,
          netPrizePool: availableDuel.netPrizePool,
          primeDistribution: poolInfo.distribution,
        });
      }

      ApiResponse.success(res, 'Matched with Prime duel room', {
        roomCode: availableDuel.roomCode,
        status: availableDuel.status,
        started: availableDuel.status === 'in-progress',
        duel: availableDuel,
        problem: fullProblemData,
        remainingCoins: currentUser.points,
      });
      return;
    }

    // No available room found -> create new waiting room with selected participants
    currentUser.points = (currentUser.points || 0) - parsedEntryFee;
    await currentUser.save();

    const problem = await pickRandomProblem(difficulty);
    if (!problem) {
      currentUser.points = (currentUser.points || 0) + parsedEntryFee;
      await currentUser.save();
      throw ApiError.notFound('No problem available for matchmaking');
    }

    let roomCode = generatePrimeRoomCode(parsedMaxParticipants);
    let exists = await CodeDuel.findOne({ roomCode });
    while (exists) {
      roomCode = generatePrimeRoomCode(parsedMaxParticipants);
      exists = await CodeDuel.findOne({ roomCode });
    }

    const poolInfo = calculatePrimeDistribution(parsedEntryFee, parsedMaxParticipants);

    const newDuel = await CodeDuel.create({
      roomCode,
      duelType: 'prime',
      problemId: problem._id,
      problemTitle: problem.title,
      problemSlug: problem.slug,
      difficulty: problem.difficulty,
      players: [
        {
          userId: user._id,
          name: user.name,
          profileImage: user.profileImage || '',
          college: user.college || '',
          status: 'joined',
          testCasesPassed: 0,
          totalTestCases: problem.testCases?.length || 3,
          coinsPaid: parsedEntryFee,
        },
      ],
      maxParticipants: parsedMaxParticipants,
      status: 'waiting',
      entryFee: parsedEntryFee,
      totalPot: parsedEntryFee,
      platformFeePercent: 10,
      platformFeeCollected: poolInfo.platformFee,
      netPrizePool: poolInfo.netPool,
      coinsReward: poolInfo.netPool,
      durationSeconds: 900,
      isPrivate: false,
    });

    try {
      await PointTransaction.create({
        userId: user._id,
        amount: -parsedEntryFee,
        type: 'PRIME_DUEL_ENTRY',
        referenceType: 'CodeDuel',
        referenceId: newDuel.roomCode,
        description: `Entry stake for Prime Battle (${newDuel.roomCode})`,
      });
    } catch (txErr: any) {
      logger.warn(`PointTransaction error for new prime queue: ${txErr.message}`);
    }

    ApiResponse.success(
      res,
      'Prime matchmaking queue initialized',
      {
        roomCode: newDuel.roomCode,
        status: 'waiting',
        duel: newDuel,
        problem: formatDuelProblemData(problem),
        remainingCoins: currentUser.points,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a waiting Prime Battle and 100% refund all participants
// @route   POST /api/duels/prime/:roomCode/cancel
// @access  Protected (Student Creator / User)
export const cancelPrimeDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    if (duel.duelType !== 'prime') {
      throw ApiError.badRequest('Only Prime battle rooms can be cancelled with coin refund here');
    }

    // Only host or if room is waiting
    if (duel.status !== 'waiting') {
      throw ApiError.badRequest('Cannot cancel a battle that has already started or ended');
    }

    const isHost = duel.players[0]?.userId?.toString() === user._id.toString();
    if (!isHost && user.role !== 'admin') {
      throw ApiError.forbidden('Only the room creator or admin can cancel this waiting room');
    }

    duel.status = 'cancelled';
    await duel.save();

    // 100% refund all participants who paid
    for (const player of duel.players) {
      if (player.coinsPaid && player.coinsPaid > 0) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { points: player.coinsPaid },
        });
        try {
          await PointTransaction.create({
            userId: player.userId,
            amount: player.coinsPaid,
            type: 'PRIME_DUEL_REFUND',
            referenceType: 'CodeDuel',
            referenceId: duel.roomCode,
            description: `Refund for cancelled Prime Battle (${cleanCode})`,
          });
        } catch (txErr: any) {
          logger.warn(`PointTransaction error for cancel refund: ${txErr.message}`);
        }
        logger.info(`[NEC Prime] Refunded ${player.coinsPaid} coins to ${player.name} (${player.userId}) for cancelled room ${cleanCode}`);
      }
    }

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
      roomCode: duel.roomCode,
      status: 'cancelled',
      reason: 'Room cancelled by host. All coin stakes refunded 100%!',
      players: duel.players,
    });

    ApiResponse.success(res, 'Prime battle room cancelled and all coin stakes refunded 100%');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's personal NEC Prime Battle stats (Gross Staked, Net Won, Matches)
// @route   GET /api/duels/prime/user/stats
// @access  Protected (Student / User)
export const getMyPrimeDuelStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const currentUser = await User.findById(user._id);

    const duels = await CodeDuel.find({
      duelType: 'prime',
      'players.userId': user._id,
      status: { $in: ['completed', 'timed-out'] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalMatches = await CodeDuel.countDocuments({
      duelType: 'prime',
      'players.userId': user._id,
      status: { $in: ['completed', 'timed-out'] },
    });

    const wins = await CodeDuel.countDocuments({
      duelType: 'prime',
      winnerId: user._id,
      status: { $in: ['completed', 'timed-out'] },
    });

    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Aggregate total coins won in Prime battles from primeWinners
    let totalCoinsWon = 0;
    duels.forEach((d) => {
      const myWinning = d.primeWinners?.find((w) => w.userId.toString() === user._id.toString());
      if (myWinning) {
        totalCoinsWon += myWinning.coinsAwarded || 0;
      }
    });

    const settings = await PlatformSettings.findOne();
    const maxParticipantsPerRoom = settings?.duelSettings?.maxParticipantsPerRoom ?? 4;

    ApiResponse.success(res, 'User Prime duel stats retrieved', {
      totalMatches,
      wins,
      losses,
      winRate,
      totalCoinsWon,
      currentBalance: currentUser?.points || 0,
      maxParticipantsPerRoom,
      recentDuels: duels.map((d) => {
        const myWinning = d.primeWinners?.find((w) => w.userId.toString() === user._id.toString());
        const isWinner = Boolean(myWinning) || d.winnerId?.toString() === user._id.toString();
        const otherPlayers = d.players.filter((p) => p.userId.toString() !== user._id.toString());
        return {
          id: d._id,
          roomCode: d.roomCode,
          problemTitle: d.problemTitle,
          difficulty: d.difficulty,
          isWinner,
          rank: myWinning?.rank ?? (isWinner ? 1 : null),
          coinsAwarded: myWinning?.coinsAwarded || (isWinner ? d.coinsReward : 0),
          opponentName: otherPlayers[0]?.name || 'Opponent',
          opponentAvatar: otherPlayers[0]?.profileImage,
          entryFee: d.entryFee,
          totalPot: d.totalPot,
          netPrizePool: d.netPrizePool,
          date: d.createdAt,
          status: d.status,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rematch in same room: Pick new problem & restart battle
// @route   POST /api/duels/:roomCode/rematch
// @access  Protected (Student / User)
export const rematchDuelRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    const isParticipant = duel.players.some((p) => p.userId.toString() === user._id.toString());
    if (!isParticipant) {
      throw ApiError.forbidden('You are not a participant in this duel');
    }

    // Pick a new random problem
    const newProblem = await pickRandomProblem(duel.difficulty);
    if (!newProblem) throw ApiError.internal('Failed to pick a new problem for rematch');

    if (duel.duelType === 'prime') {
      // Validate all players have enough coins to re-stake
      for (const p of duel.players) {
        if (!p.isAi) {
          const u = await User.findById(p.userId);
          if (!u || (u.points || 0) < duel.entryFee) {
            throw ApiError.badRequest(`Cannot start Prime rematch: ${p.name} does not have enough coins (${duel.entryFee} coins required).`);
          }
        }
      }
      // Deduct entry fee and record PointTransaction
      for (const p of duel.players) {
        if (!p.isAi) {
          await User.findByIdAndUpdate(p.userId, { $inc: { points: -duel.entryFee } });
          try {
            await PointTransaction.create({
              userId: p.userId,
              amount: -duel.entryFee,
              type: 'PRIME_DUEL_ENTRY',
              referenceType: 'CodeDuel',
              referenceId: duel.roomCode,
              description: `Rematch stake for Prime Battle (${duel.roomCode})`,
            });
          } catch (txErr: any) {
            logger.warn(`PointTransaction error for rematch stake: ${txErr.message}`);
          }
        }
      }
      duel.primeWinners = [];
    }

    duel.problemId = newProblem._id as any;
    duel.problemTitle = newProblem.title;
    duel.problemSlug = newProblem.slug;
    duel.status = 'in-progress';
    duel.winnerId = null as any;
    duel.winningReason = undefined;

    const now = new Date();
    duel.startedAt = now;
    duel.expiresAt = new Date(now.getTime() + duel.durationSeconds * 1000);

    duel.players.forEach((p) => {
      p.status = 'coding';
      p.testCasesPassed = 0;
      p.submittedCode = undefined;
      p.submittedLanguage = undefined;
      p.submittedAt = undefined;
    });

    await duel.save();

    const fullProblemData = formatDuelProblemData(newProblem);

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:start', {
      roomCode: duel.roomCode,
      startedAt: duel.startedAt,
      expiresAt: duel.expiresAt,
      durationSeconds: duel.durationSeconds,
      players: duel.players,
      maxParticipants: duel.maxParticipants,
      problem: fullProblemData,
    });

    ApiResponse.success(res, 'Rematch started successfully!', {
      duel,
      problem: fullProblemData,
      timeRemainingSeconds: duel.durationSeconds,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a waiting standard duel room
// @route   POST /api/duels/:roomCode/cancel
// @access  Protected (Room Host / Admin)
export const cancelStandardDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    if (duel.status !== 'waiting') {
      throw ApiError.badRequest('Cannot cancel a battle that has already started or ended');
    }

    const isHost = duel.players[0]?.userId?.toString() === user._id.toString();
    if (!isHost && user.role !== 'admin') {
      throw ApiError.forbidden('Only the room creator or admin can cancel this waiting room');
    }

    duel.status = 'cancelled';
    await duel.save();

    socketService.broadcastToRoom(`duel:${cleanCode}`, 'duel:game_over', {
      roomCode: duel.roomCode,
      status: 'cancelled',
      reason: 'Room cancelled by host',
      players: duel.players,
    });

    ApiResponse.success(res, 'Duel room cancelled successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Settle and finalize an expired/timed-out duel room immediately
// @route   POST /api/duels/:roomCode/timeout
// @access  Protected (Student / Participant)
export const timeoutDuel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const cleanCode = roomCode.trim().toUpperCase();

    const duel = await CodeDuel.findOne({ roomCode: cleanCode });
    if (!duel) throw ApiError.notFound('Duel room not found');

    if (duel.status === 'in-progress') {
      await resolveDuelTimeout(duel, cleanCode);
    }

    ApiResponse.success(res, 'Duel timeout resolved successfully', { duel });
  } catch (error) {
    next(error);
  }
};

