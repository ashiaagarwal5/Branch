"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeedPost = createFeedPost;
exports.listFeed = listFeed;
exports.addKudos = addKudos;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const FEED_COLLECTION = 'feed';
const KUDOS_COLLECTION = 'kudos';
async function createFeedPost(userId, input) {
    const ref = firebase_1.db.collection(FEED_COLLECTION).doc();
    await ref.set({
        userId,
        type: input.type,
        message: input.message || null,
        payload: input.payload || {},
        scope: input.scope || 'friends',
        imageUrl: input.imageUrl || null,
        reactions: {},
        createdAt: (0, firestore_1.nowTimestamp)(),
        updatedAt: (0, firestore_1.nowTimestamp)(),
    });
    return { id: ref.id };
}
async function listFeed(userId, options = {}) {
    let query = firebase_1.db
        .collection(FEED_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(options.limit || 25);
    if (options.scope === 'public') {
        query = query.where('scope', '==', 'public');
    }
    const snapshot = await query.get();
    return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((post) => {
        if (post.scope === 'public')
            return true;
        if (post.scope === 'friends') {
            return post.userId === userId || (post.allowedUsers || []).includes(userId);
        }
        return post.userId === userId;
    });
}
async function addKudos(userId, feedId, emoji, message) {
    const kudosRef = firebase_1.db.collection(KUDOS_COLLECTION).doc();
    await kudosRef.set({
        feedId,
        userId,
        emoji,
        message: message || null,
        createdAt: (0, firestore_1.nowTimestamp)(),
    });
    const feedRef = firebase_1.db.collection(FEED_COLLECTION).doc(feedId);
    await feedRef.set({
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return { id: kudosRef.id };
}
//# sourceMappingURL=socialService.js.map