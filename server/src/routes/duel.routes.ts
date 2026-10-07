import { Router } from 'express';
import {
  createDuelRoom,
  joinDuelRoom,
  quickMatch,
  getDuelDetails,
  submitDuelSolution,
  getMyDuelStats,
  startDuelNow,
  getMyActiveDuel,
  joinAiDuel,
  createPrimeDuelRoom,
  joinPrimeDuelRoom,
  quickMatchPrime,
  cancelPrimeDuel,
  getMyPrimeDuelStats,
  runDuelTests,
  completeAiDuel,
  rematchDuelRoom,
  leaveDuelRoom,
  cancelStandardDuel,
  timeoutDuel,
} from '../controllers/duel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Standard 1vs1 Code Duel Endpoints
router.post('/create', authenticate, createDuelRoom);
router.post('/join', authenticate, joinDuelRoom);
router.post('/quick-match', authenticate, quickMatch);
router.get('/my-active', authenticate, getMyActiveDuel);
router.get('/user/stats', authenticate, getMyDuelStats);

// 👑 NEC Prime Battle Endpoints (Staked Coins)
router.post('/prime/create', authenticate, createPrimeDuelRoom);
router.post('/prime/join', authenticate, joinPrimeDuelRoom);
router.post('/prime/quick-match', authenticate, quickMatchPrime);
router.get('/prime/user/stats', authenticate, getMyPrimeDuelStats);
router.post('/prime/:roomCode/cancel', authenticate, cancelPrimeDuel);

// Shared Battle Operations (Room Code lookup)
router.post('/:roomCode/start-now', authenticate, startDuelNow);
router.post('/:roomCode/join-ai', authenticate, joinAiDuel);
router.get('/:roomCode', authenticate, getDuelDetails);
router.post('/:roomCode/run-tests', authenticate, runDuelTests);
router.post('/:roomCode/submit', authenticate, submitDuelSolution);
router.post('/:roomCode/ai-win', authenticate, completeAiDuel);
router.post('/:roomCode/rematch', authenticate, rematchDuelRoom);
router.post('/:roomCode/leave', authenticate, leaveDuelRoom);
router.post('/:roomCode/cancel', authenticate, cancelStandardDuel);
router.post('/:roomCode/timeout', authenticate, timeoutDuel);

export default router;
