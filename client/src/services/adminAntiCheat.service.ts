import { sundayContestService } from './contest.service';
import { monthlyContestService } from './monthlyContest.service';
import { adminDuelService, AdminDuelItem } from './adminDuel.service';

export type ArenaType = 'all' | 'weekly' | 'monthly' | 'duel' | 'prime';
export type AntiCheatStatus = 'all' | 'clean' | 'suspicious' | 'flagged' | 'disqualified';

export interface UnifiedAntiCheatRecord {
  id: string;
  userId: string;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  college?: string;
  arenaType: 'weekly' | 'monthly' | 'duel' | 'prime';
  arenaBadge: string;
  arenaTitle: string;
  roomCode?: string;
  problemTitle?: string;
  tabSwitchesCount: number;
  pasteCount: number;
  timeTakenSeconds?: number;
  status: 'clean' | 'suspicious' | 'flagged' | 'disqualified';
  reason: string;
  logs: Array<{ timestamp: string; eventType?: string; details: string }>;
  submittedCode?: string;
  submittedLanguage?: string;
  adminOverridden?: boolean;
  createdAt: string;
  sourceRef: {
    duelId?: string;
    playerId?: string;
    contestId?: string;
    monthKey?: string;
  };
}

export interface AntiCheatStats {
  totalAudited: number;
  cleanCount: number;
  suspiciousCount: number;
  flaggedCount: number;
  disqualifiedCount: number;
}

class AdminAntiCheatService {
  /**
   * Aggregate all anti-cheat participant data across all platform modules
   */
  public async getAllAntiCheatRecords(): Promise<UnifiedAntiCheatRecord[]> {
    const records: UnifiedAntiCheatRecord[] = [];

    // 1. Fetch Weekly Contest Participants
    try {
      const weeklyParticipants = sundayContestService.getAntiCheatParticipants();
      weeklyParticipants.forEach((p, idx) => {
        const rawStatus = (p.antiCheat?.status || 'Clean').toLowerCase();
        const normStatus = (rawStatus === 'disqualified'
          ? 'disqualified'
          : rawStatus === 'flagged'
          ? 'flagged'
          : rawStatus === 'suspicious'
          ? 'suspicious'
          : 'clean') as 'clean' | 'suspicious' | 'flagged' | 'disqualified';

        records.push({
          id: `weekly_${p.userId || p.username || idx}`,
          userId: p.userId || `user_${idx}`,
          username: p.username || 'contestant',
          name: p.name || p.username || 'Contestant',
          email: (p as any).email || `${p.username || 'student'}@nextera.dev`,
          avatar: p.avatar,
          college: p.college || 'Engineering Institute',
          arenaType: 'weekly',
          arenaBadge: 'Weekly Contest',
          arenaTitle: 'Sunday Algorithmic DSA Contest',
          problemTitle: 'Contest Challenge Set (4 Problems)',
          tabSwitchesCount: p.antiCheat?.tabSwitchesCount ?? 0,
          pasteCount: p.antiCheat?.pasteCount ?? 0,
          timeTakenSeconds: p.antiCheat?.timeTakenSeconds ?? (p as any).totalTimeSeconds ?? 1200,
          status: normStatus,
          reason: p.antiCheat?.reason || 'Normal coding pattern detected',
          logs: (p.antiCheat?.logs || []).map((l: any) => ({
            timestamp: l.timestamp || '10:00 AM',
            eventType: l.eventType || l.type || 'audit',
            details: l.details || l.detail || 'Contest arena event',
          })),
          submittedCode: (p as any).submittedCode,
          submittedLanguage: (p as any).language || 'Java',
          adminOverridden: false,
          createdAt: p.antiCheat?.submittedAt || new Date().toISOString(),
          sourceRef: {
            contestId: 'weekly_current',
          },
        });
      });
    } catch (err) {
      console.warn('[AdminAntiCheat] Error reading weekly participants:', err);
    }

    // 2. Fetch Monthly Contest Participants
    try {
      const monthlyParticipants = monthlyContestService.getAntiCheatParticipants();
      monthlyParticipants.forEach((p, idx) => {
        const rawStatus = (p.antiCheat?.status || 'Clean').toLowerCase();
        const normStatus = (rawStatus === 'disqualified'
          ? 'disqualified'
          : rawStatus === 'flagged'
          ? 'flagged'
          : rawStatus === 'suspicious'
          ? 'suspicious'
          : 'clean') as 'clean' | 'suspicious' | 'flagged' | 'disqualified';

        records.push({
          id: `monthly_${p.userId || p.username || idx}`,
          userId: p.userId || `user_m_${idx}`,
          username: p.username || 'contestant',
          name: p.name || p.username || 'Grand Contestant',
          email: (p as any).email || `${p.username || 'student'}@nextera.dev`,
          avatar: p.avatar,
          college: p.college || 'Grand League Institute',
          arenaType: 'monthly',
          arenaBadge: 'Monthly Grand Contest',
          arenaTitle: 'Monthly 1800🪙 Grand Championship',
          problemTitle: 'Grand Challenge Suite (18 Problems)',
          tabSwitchesCount: p.antiCheat?.tabSwitchesCount ?? 0,
          pasteCount: p.antiCheat?.pasteCount ?? 0,
          timeTakenSeconds: p.antiCheat?.timeTakenSeconds ?? 3600,
          status: normStatus,
          reason: p.antiCheat?.reason || 'Monitored proctoring session',
          logs: (p.antiCheat?.logs || []).map((l: any) => ({
            timestamp: l.timestamp || '12:00 PM',
            eventType: l.eventType || l.type || 'audit',
            details: l.details || l.detail || 'Monthly arena event',
          })),
          submittedCode: (p as any).submittedCode,
          submittedLanguage: (p as any).language || 'Python',
          adminOverridden: false,
          createdAt: p.antiCheat?.submittedAt || new Date().toISOString(),
          sourceRef: {
            monthKey: 'current',
          },
        });
      });
    } catch (err) {
      console.warn('[AdminAntiCheat] Error reading monthly participants:', err);
    }

    // 3. Fetch Standard 1vs1 Code Duels
    try {
      const duelsRes = await adminDuelService.getDuels({ page: 1, limit: 40 });
      const duels = duelsRes.duels || [];
      duels.forEach((d: AdminDuelItem) => {
        if (!d.players || d.players.length === 0) return;
        d.players.forEach((p, pIdx) => {
          const pUserId = typeof p.userId === 'object' ? (p.userId?._id || p.userId?.id || `u_${pIdx}`) : (p.userId || `u_${pIdx}`);
          const pEmail = typeof p.userId === 'object' ? p.userId?.email : undefined;
          const pCollege = typeof p.userId === 'object' ? p.userId?.college : p.college;
          const rawStatus = (p.antiCheat?.status || 'clean').toLowerCase();
          const normStatus = (rawStatus === 'disqualified'
            ? 'disqualified'
            : rawStatus === 'flagged'
            ? 'flagged'
            : rawStatus === 'suspicious'
            ? 'suspicious'
            : 'clean') as 'clean' | 'suspicious' | 'flagged' | 'disqualified';

          records.push({
            id: `duel_${d._id}_${pUserId}`,
            userId: pUserId,
            username: p.name.toLowerCase().replace(/\s+/g, '_'),
            name: p.name,
            email: pEmail,
            avatar: p.profileImage,
            college: pCollege || 'Arena Competitor',
            arenaType: 'duel',
            arenaBadge: '1vs1 Battle (Standard)',
            arenaTitle: `NEC Battle ${d.roomCode}`,
            roomCode: d.roomCode,
            problemTitle: d.problemTitle,
            tabSwitchesCount: p.antiCheat?.tabSwitchesCount ?? 0,
            pasteCount: p.antiCheat?.pasteCount ?? 0,
            timeTakenSeconds: p.antiCheat?.timeTakenSeconds ?? p.executionTime ?? 0,
            status: normStatus,
            reason: p.antiCheat?.reason || (normStatus === 'clean' ? 'Normal coding telemetry' : 'Potential tab switch violation'),
            logs: (p.antiCheat?.logs || []).map((l: any) => ({
              timestamp: l.timestamp || 'Live',
              eventType: l.eventType,
              details: l.details || 'Event logged',
            })),
            submittedCode: p.submittedCode,
            submittedLanguage: p.submittedLanguage,
            adminOverridden: p.antiCheat?.adminOverridden || false,
            createdAt: p.submittedAt || d.createdAt || new Date().toISOString(),
            sourceRef: {
              duelId: d._id,
              playerId: pUserId,
            },
          });
        });
      });
    } catch (err) {
      console.warn('[AdminAntiCheat] Error fetching standard duels:', err);
    }

    // 4. Fetch NEC Prime Battles
    try {
      const primeRes = await adminDuelService.getPrimeDuels({ page: 1, limit: 40 });
      const primeDuels = primeRes.duels || [];
      primeDuels.forEach((d: AdminDuelItem) => {
        if (!d.players || d.players.length === 0) return;
        d.players.forEach((p, pIdx) => {
          const pUserId = typeof p.userId === 'object' ? (p.userId?._id || p.userId?.id || `pu_${pIdx}`) : (p.userId || `pu_${pIdx}`);
          const pEmail = typeof p.userId === 'object' ? p.userId?.email : undefined;
          const pCollege = typeof p.userId === 'object' ? p.userId?.college : p.college;
          const rawStatus = (p.antiCheat?.status || 'clean').toLowerCase();
          const normStatus = (rawStatus === 'disqualified'
            ? 'disqualified'
            : rawStatus === 'flagged'
            ? 'flagged'
            : rawStatus === 'suspicious'
            ? 'suspicious'
            : 'clean') as 'clean' | 'suspicious' | 'flagged' | 'disqualified';

          records.push({
            id: `prime_${d._id}_${pUserId}`,
            userId: pUserId,
            username: p.name.toLowerCase().replace(/\s+/g, '_'),
            name: p.name,
            email: pEmail,
            avatar: p.profileImage,
            college: pCollege || 'Prime Gladiator',
            arenaType: 'prime',
            arenaBadge: 'Prime Battle (Staked 🪙)',
            arenaTitle: `NEC Prime ${d.roomCode} (${d.entryFee || 50}🪙 Entry)`,
            roomCode: d.roomCode,
            problemTitle: d.problemTitle,
            tabSwitchesCount: p.antiCheat?.tabSwitchesCount ?? 0,
            pasteCount: p.antiCheat?.pasteCount ?? 0,
            timeTakenSeconds: p.antiCheat?.timeTakenSeconds ?? p.executionTime ?? 0,
            status: normStatus,
            reason: p.antiCheat?.reason || (normStatus === 'clean' ? 'Verified coin stake battle telemetry' : 'Unfair paste or tab defocus detected'),
            logs: (p.antiCheat?.logs || []).map((l: any) => ({
              timestamp: l.timestamp || 'Live',
              eventType: l.eventType,
              details: l.details || 'Event logged',
            })),
            submittedCode: p.submittedCode,
            submittedLanguage: p.submittedLanguage,
            adminOverridden: p.antiCheat?.adminOverridden || false,
            createdAt: p.submittedAt || d.createdAt || new Date().toISOString(),
            sourceRef: {
              duelId: d._id,
              playerId: pUserId,
            },
          });
        });
      });
    } catch (err) {
      console.warn('[AdminAntiCheat] Error fetching prime battles:', err);
    }

    // Sort by createdAt descending (most recent first)
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Override a participant's anti-cheat verdict
   */
  public async overrideVerdict(
    record: UnifiedAntiCheatRecord,
    newStatus: 'clean' | 'suspicious' | 'flagged' | 'disqualified',
    reason?: string
  ): Promise<boolean> {
    const updatedReason = reason || `Admin manual audit override to ${newStatus.toUpperCase()}`;

    try {
      if (record.arenaType === 'duel' || record.arenaType === 'prime') {
        if (record.sourceRef.duelId && record.sourceRef.playerId) {
          await adminDuelService.overridePlayerAntiCheat(
            record.sourceRef.duelId,
            record.sourceRef.playerId,
            newStatus,
            updatedReason
          );
          return true;
        }
      } else if (record.arenaType === 'monthly') {
        monthlyContestService.overrideMonthlyAntiCheatStatus(
          record.userId || record.email || record.username,
          newStatus,
          updatedReason
        );
        return true;
      } else if (record.arenaType === 'weekly') {
        const capitalStatus = newStatus === 'flagged' || newStatus === 'disqualified'
          ? 'Flagged'
          : newStatus === 'suspicious'
          ? 'Suspicious'
          : 'Clean';
        sundayContestService.overrideAntiCheatStatus(
          record.userId || record.username,
          capitalStatus as any,
          updatedReason
        );
        return true;
      }
    } catch (err) {
      console.error('[AdminAntiCheat] Failed to override verdict:', err);
      throw err;
    }

    return false;
  }
}

export const adminAntiCheatService = new AdminAntiCheatService();
