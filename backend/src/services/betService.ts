import { db } from '../config/firebase';
import { nowTimestamp, toTimestamp } from '../utils/firestore';

const BETS_COLLECTION = 'bets';
const USERS_COLLECTION = 'users';
const LEDGER_COLLECTION = 'pointsLedger';

type BetStatus = 'pending' | 'active' | 'declined' | 'cancelled' | 'settled' | 'disputed';

export interface CreateBetInput {
  opponentId: string;
  wager: number;
  description?: string;
  conditions: string;
  resolveBy?: string | Date | null;
}

export interface ListBetsOptions {
  status?: BetStatus;
  role?: 'creator' | 'opponent' | 'all';
}

function ensurePositiveBalance(balance: number | undefined, wager: number) {
  if ((balance ?? 0) < wager) {
    throw Object.assign(new Error('Insufficient points'), {
      status: 400,
      code: 'insufficient_points',
    });
  }
}

export async function createBet(userId: string, input: CreateBetInput) {
  if (input.opponentId === userId) {
    throw Object.assign(new Error('Cannot bet against yourself'), {
      status: 400,
      code: 'invalid_opponent',
    });
  }

  const betRef = db.collection(BETS_COLLECTION).doc();
  const creatorLedgerRef = db.collection(LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const creatorRef = db.collection(USERS_COLLECTION).doc(userId);
    const creatorSnapshot = await transaction.get(creatorRef);

    ensurePositiveBalance(creatorSnapshot.data()?.points, input.wager);

    transaction.update(creatorRef, {
      points: (creatorSnapshot.data()?.points || 0) - input.wager,
      updatedAt: nowTimestamp(),
    });

    transaction.set(creatorLedgerRef, {
      userId,
      betId: betRef.id,
      delta: -input.wager,
      reason: 'bet_escrow',
      balanceAfter: (creatorSnapshot.data()?.points || 0) - input.wager,
      createdAt: nowTimestamp(),
    });

    transaction.set(betRef, {
      creatorId: userId,
      opponentId: input.opponentId,
      wager: input.wager,
      description: input.description || null,
      conditions: input.conditions,
      resolveBy: input.resolveBy ? toTimestamp(input.resolveBy) : null,
      status: 'pending',
      creatorEscrowed: input.wager,
      opponentEscrowed: 0,
      participants: [userId, input.opponentId],
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    });
  });

  return { id: betRef.id };
}

export async function listBets(
  userId: string,
  options: ListBetsOptions = {}
) {
  let query = db
    .collection(BETS_COLLECTION)
    .where('participants', 'array-contains', userId)
    .orderBy('updatedAt', 'desc');

  if (options.status) {
    query = query.where('status', '==', options.status);
  }

  const snapshot = await query.get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((bet: any) => {
      if (!options.role || options.role === 'all') return true;
      if (options.role === 'creator') return bet.creatorId === userId;
      if (options.role === 'opponent') return bet.opponentId === userId;
      return true;
    });
}

export async function acceptBet(userId: string, betId: string) {
  const betRef = db.collection(BETS_COLLECTION).doc(betId);
  const ledgerRef = db.collection(LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const betSnapshot = await transaction.get(betRef);
    if (!betSnapshot.exists) {
      throw Object.assign(new Error('Bet not found'), {
        status: 404,
        code: 'bet_not_found',
      });
    }
    const betData = betSnapshot.data() as any;
    if (betData.opponentId !== userId) {
      throw Object.assign(new Error('Only opponent can accept'), {
        status: 403,
        code: 'not_opponent',
      });
    }
    if (betData.status !== 'pending') {
      throw Object.assign(new Error('Bet cannot be accepted'), {
        status: 400,
        code: 'bet_not_pending',
      });
    }

    const opponentRef = db.collection(USERS_COLLECTION).doc(userId);
    const opponentSnapshot = await transaction.get(opponentRef);

    ensurePositiveBalance(opponentSnapshot.data()?.points, betData.wager);

    transaction.update(opponentRef, {
      points: (opponentSnapshot.data()?.points || 0) - betData.wager,
      updatedAt: nowTimestamp(),
    });

    transaction.set(ledgerRef, {
      userId,
      betId,
      delta: -betData.wager,
      reason: 'bet_escrow',
      balanceAfter: (opponentSnapshot.data()?.points || 0) - betData.wager,
      createdAt: nowTimestamp(),
    });

    transaction.update(betRef, {
      status: 'active',
      opponentEscrowed: betData.wager,
      participants: [betData.creatorId, betData.opponentId],
      updatedAt: nowTimestamp(),
    });
  });

  return (await betRef.get()).data();
}

export async function declineBet(userId: string, betId: string) {
  const betRef = db.collection(BETS_COLLECTION).doc(betId);
  const refundLedgerRef = db.collection(LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const betSnapshot = await transaction.get(betRef);
    if (!betSnapshot.exists) {
      throw Object.assign(new Error('Bet not found'), {
        status: 404,
        code: 'bet_not_found',
      });
    }
    const betData = betSnapshot.data() as any;
    if (![betData.opponentId, betData.creatorId].includes(userId)) {
      throw Object.assign(new Error('User not part of bet'), {
        status: 403,
        code: 'not_participant',
      });
    }
    if (betData.status !== 'pending') {
      throw Object.assign(new Error('Bet not pending'), {
        status: 400,
        code: 'bet_not_pending',
      });
    }

    const creatorRef = db.collection(USERS_COLLECTION).doc(betData.creatorId);
    const creatorSnapshot = await transaction.get(creatorRef);
    const currentPoints = creatorSnapshot.data()?.points || 0;

    transaction.update(creatorRef, {
      points: currentPoints + betData.wager,
      updatedAt: nowTimestamp(),
    });

    transaction.set(refundLedgerRef, {
      userId: betData.creatorId,
      betId,
      delta: betData.wager,
      reason: 'bet_refund',
      balanceAfter: currentPoints + betData.wager,
      createdAt: nowTimestamp(),
    });

    transaction.update(betRef, {
      status: 'declined',
      updatedAt: nowTimestamp(),
    });
  });

  return (await betRef.get()).data();
}

export async function resolveBet(
  userId: string,
  betId: string,
  winnerId: string,
  metadata?: Record<string, unknown>
) {
  const betRef = db.collection(BETS_COLLECTION).doc(betId);
  const winnerLedgerRef = db.collection(LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const betSnapshot = await transaction.get(betRef);
    if (!betSnapshot.exists) {
      throw Object.assign(new Error('Bet not found'), {
        status: 404,
        code: 'bet_not_found',
      });
    }
    const betData = betSnapshot.data() as any;

    if (![betData.creatorId, betData.opponentId].includes(userId)) {
      throw Object.assign(new Error('Only participants may resolve'), {
        status: 403,
        code: 'not_participant',
      });
    }

    if (![betData.creatorId, betData.opponentId].includes(winnerId)) {
      throw Object.assign(new Error('Winner must be a participant'), {
        status: 400,
        code: 'invalid_winner',
      });
    }

    if (betData.status !== 'active') {
      throw Object.assign(new Error('Bet is not active'), {
        status: 400,
        code: 'bet_not_active',
      });
    }

    const totalPot = (betData.creatorEscrowed || 0) + (betData.opponentEscrowed || 0);
    const winnerRef = db.collection(USERS_COLLECTION).doc(winnerId);
    const winnerSnapshot = await transaction.get(winnerRef);
    const newBalance = (winnerSnapshot.data()?.points || 0) + totalPot;

    transaction.update(winnerRef, {
      points: newBalance,
      updatedAt: nowTimestamp(),
    });

    transaction.set(winnerLedgerRef, {
      userId: winnerId,
      betId,
      delta: totalPot,
      reason: 'bet_win',
      balanceAfter: newBalance,
      metadata: metadata || {},
      createdAt: nowTimestamp(),
    });

    transaction.update(betRef, {
      status: 'settled',
      winnerId,
      resolvedBy: userId,
      resolvedAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
      metadata: metadata || {},
    });
  });

  return (await betRef.get()).data();
}

export async function disputeBet(userId: string, betId: string, reason: string) {
  const betRef = db.collection(BETS_COLLECTION).doc(betId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(betRef);
    if (!snapshot.exists) {
      throw Object.assign(new Error('Bet not found'), {
        status: 404,
        code: 'bet_not_found',
      });
    }
    const bet = snapshot.data() as any;
    if (![bet.creatorId, bet.opponentId].includes(userId)) {
      throw Object.assign(new Error('User not part of bet'), {
        status: 403,
        code: 'not_participant',
      });
    }

    transaction.update(betRef, {
      status: 'disputed',
      disputeRaisedBy: userId,
      disputeReason: reason,
      updatedAt: nowTimestamp(),
    });
  });

  return (await betRef.get()).data();
}

