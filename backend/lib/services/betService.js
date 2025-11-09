"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBet = createBet;
exports.listBets = listBets;
exports.acceptBet = acceptBet;
exports.declineBet = declineBet;
exports.resolveBet = resolveBet;
exports.disputeBet = disputeBet;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const BETS_COLLECTION = 'bets';
const USERS_COLLECTION = 'users';
const LEDGER_COLLECTION = 'pointsLedger';
function ensurePositiveBalance(balance, wager) {
    if ((balance ?? 0) < wager) {
        throw Object.assign(new Error('Insufficient points'), {
            status: 400,
            code: 'insufficient_points',
        });
    }
}
async function createBet(userId, input) {
    if (input.opponentId === userId) {
        throw Object.assign(new Error('Cannot bet against yourself'), {
            status: 400,
            code: 'invalid_opponent',
        });
    }
    const betRef = firebase_1.db.collection(BETS_COLLECTION).doc();
    const creatorLedgerRef = firebase_1.db.collection(LEDGER_COLLECTION).doc();
    await firebase_1.db.runTransaction(async (transaction) => {
        const creatorRef = firebase_1.db.collection(USERS_COLLECTION).doc(userId);
        const creatorSnapshot = await transaction.get(creatorRef);
        ensurePositiveBalance(creatorSnapshot.data()?.points, input.wager);
        transaction.update(creatorRef, {
            points: (creatorSnapshot.data()?.points || 0) - input.wager,
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(creatorLedgerRef, {
            userId,
            betId: betRef.id,
            delta: -input.wager,
            reason: 'bet_escrow',
            balanceAfter: (creatorSnapshot.data()?.points || 0) - input.wager,
            createdAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(betRef, {
            creatorId: userId,
            opponentId: input.opponentId,
            wager: input.wager,
            description: input.description || null,
            conditions: input.conditions,
            resolveBy: input.resolveBy ? (0, firestore_1.toTimestamp)(input.resolveBy) : null,
            status: 'pending',
            creatorEscrowed: input.wager,
            opponentEscrowed: 0,
            participants: [userId, input.opponentId],
            createdAt: (0, firestore_1.nowTimestamp)(),
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
    });
    return { id: betRef.id };
}
async function listBets(userId, options = {}) {
    let query = firebase_1.db
        .collection(BETS_COLLECTION)
        .where('participants', 'array-contains', userId)
        .orderBy('updatedAt', 'desc');
    if (options.status) {
        query = query.where('status', '==', options.status);
    }
    const snapshot = await query.get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((bet) => {
        if (!options.role || options.role === 'all')
            return true;
        if (options.role === 'creator')
            return bet.creatorId === userId;
        if (options.role === 'opponent')
            return bet.opponentId === userId;
        return true;
    });
}
async function acceptBet(userId, betId) {
    const betRef = firebase_1.db.collection(BETS_COLLECTION).doc(betId);
    const ledgerRef = firebase_1.db.collection(LEDGER_COLLECTION).doc();
    await firebase_1.db.runTransaction(async (transaction) => {
        const betSnapshot = await transaction.get(betRef);
        if (!betSnapshot.exists) {
            throw Object.assign(new Error('Bet not found'), {
                status: 404,
                code: 'bet_not_found',
            });
        }
        const betData = betSnapshot.data();
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
        const opponentRef = firebase_1.db.collection(USERS_COLLECTION).doc(userId);
        const opponentSnapshot = await transaction.get(opponentRef);
        ensurePositiveBalance(opponentSnapshot.data()?.points, betData.wager);
        transaction.update(opponentRef, {
            points: (opponentSnapshot.data()?.points || 0) - betData.wager,
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(ledgerRef, {
            userId,
            betId,
            delta: -betData.wager,
            reason: 'bet_escrow',
            balanceAfter: (opponentSnapshot.data()?.points || 0) - betData.wager,
            createdAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.update(betRef, {
            status: 'active',
            opponentEscrowed: betData.wager,
            participants: [betData.creatorId, betData.opponentId],
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
    });
    return (await betRef.get()).data();
}
async function declineBet(userId, betId) {
    const betRef = firebase_1.db.collection(BETS_COLLECTION).doc(betId);
    const refundLedgerRef = firebase_1.db.collection(LEDGER_COLLECTION).doc();
    await firebase_1.db.runTransaction(async (transaction) => {
        const betSnapshot = await transaction.get(betRef);
        if (!betSnapshot.exists) {
            throw Object.assign(new Error('Bet not found'), {
                status: 404,
                code: 'bet_not_found',
            });
        }
        const betData = betSnapshot.data();
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
        const creatorRef = firebase_1.db.collection(USERS_COLLECTION).doc(betData.creatorId);
        const creatorSnapshot = await transaction.get(creatorRef);
        const currentPoints = creatorSnapshot.data()?.points || 0;
        transaction.update(creatorRef, {
            points: currentPoints + betData.wager,
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(refundLedgerRef, {
            userId: betData.creatorId,
            betId,
            delta: betData.wager,
            reason: 'bet_refund',
            balanceAfter: currentPoints + betData.wager,
            createdAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.update(betRef, {
            status: 'declined',
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
    });
    return (await betRef.get()).data();
}
async function resolveBet(userId, betId, winnerId, metadata) {
    const betRef = firebase_1.db.collection(BETS_COLLECTION).doc(betId);
    const winnerLedgerRef = firebase_1.db.collection(LEDGER_COLLECTION).doc();
    await firebase_1.db.runTransaction(async (transaction) => {
        const betSnapshot = await transaction.get(betRef);
        if (!betSnapshot.exists) {
            throw Object.assign(new Error('Bet not found'), {
                status: 404,
                code: 'bet_not_found',
            });
        }
        const betData = betSnapshot.data();
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
        const winnerRef = firebase_1.db.collection(USERS_COLLECTION).doc(winnerId);
        const winnerSnapshot = await transaction.get(winnerRef);
        const newBalance = (winnerSnapshot.data()?.points || 0) + totalPot;
        transaction.update(winnerRef, {
            points: newBalance,
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(winnerLedgerRef, {
            userId: winnerId,
            betId,
            delta: totalPot,
            reason: 'bet_win',
            balanceAfter: newBalance,
            metadata: metadata || {},
            createdAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.update(betRef, {
            status: 'settled',
            winnerId,
            resolvedBy: userId,
            resolvedAt: (0, firestore_1.nowTimestamp)(),
            updatedAt: (0, firestore_1.nowTimestamp)(),
            metadata: metadata || {},
        });
    });
    return (await betRef.get()).data();
}
async function disputeBet(userId, betId, reason) {
    const betRef = firebase_1.db.collection(BETS_COLLECTION).doc(betId);
    await firebase_1.db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(betRef);
        if (!snapshot.exists) {
            throw Object.assign(new Error('Bet not found'), {
                status: 404,
                code: 'bet_not_found',
            });
        }
        const bet = snapshot.data();
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
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
    });
    return (await betRef.get()).data();
}
//# sourceMappingURL=betService.js.map