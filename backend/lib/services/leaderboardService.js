"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = getLeaderboard;
const firebase_1 = require("../config/firebase");
const LEADERBOARD_COLLECTION = 'leaderboards';
function docIdFromQuery(query) {
    return `${query.scope}-${query.period}-${query.category}`;
}
async function getLeaderboard(query) {
    const docId = docIdFromQuery(query);
    const snapshot = await firebase_1.db
        .collection(LEADERBOARD_COLLECTION)
        .doc(docId)
        .get();
    if (!snapshot.exists) {
        return {
            entries: [],
            count: 0,
        };
    }
    const data = snapshot.data();
    const entries = (data.entries || []).slice(0, query.limit ? Math.min(query.limit, data.entries.length) : data.entries.length);
    let userRank = null;
    if (query.userId) {
        const match = data.entries.findIndex((entry) => entry.userId === query.userId);
        userRank = match >= 0 ? match + 1 : null;
    }
    return {
        entries,
        count: entries.length,
        generatedAt: data.updatedAt,
        userRank,
    };
}
//# sourceMappingURL=leaderboardService.js.map