"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCompositeProfile = getUserCompositeProfile;
exports.updateUserPreferences = updateUserPreferences;
exports.upsertAdaptiveState = upsertAdaptiveState;
exports.recordUserModelSnapshot = recordUserModelSnapshot;
exports.flagUserForDeletion = flagUserForDeletion;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const USERS_COLLECTION = 'users';
const USER_SETTINGS_COLLECTION = 'userSettings';
const USER_MODEL_COLLECTION = 'userModels';
const USER_ADAPTIVE_STATE_COLLECTION = 'userAdaptiveState';
async function getUserCompositeProfile(userId) {
    const [userDoc, settingsDoc, modelDoc, adaptiveDoc] = await Promise.all([
        firebase_1.db.collection(USERS_COLLECTION).doc(userId).get(),
        firebase_1.db.collection(USER_SETTINGS_COLLECTION).doc(userId).get(),
        firebase_1.db.collection(USER_MODEL_COLLECTION).doc(userId).get(),
        firebase_1.db.collection(USER_ADAPTIVE_STATE_COLLECTION).doc(userId).get(),
    ]);
    return {
        user: userDoc.data() || null,
        settings: settingsDoc.data() || null,
        model: modelDoc.data() || null,
        adaptiveState: adaptiveDoc.data() || null,
    };
}
async function updateUserPreferences(userId, preferences) {
    const ref = firebase_1.db.collection(USER_SETTINGS_COLLECTION).doc(userId);
    await ref.set({
        userId,
        preferences,
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return (await ref.get()).data();
}
async function upsertAdaptiveState(userId, update) {
    const ref = firebase_1.db.collection(USER_ADAPTIVE_STATE_COLLECTION).doc(userId);
    await ref.set({
        userId,
        ...update,
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return (await ref.get()).data();
}
async function recordUserModelSnapshot(userId, payload) {
    const ref = firebase_1.db.collection(USER_MODEL_COLLECTION).doc(userId);
    await ref.set({
        userId,
        ...payload,
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return (await ref.get()).data();
}
async function flagUserForDeletion(userId) {
    await firebase_1.db
        .collection(USERS_COLLECTION)
        .doc(userId)
        .set({
        deletionRequestedAt: (0, firestore_1.nowTimestamp)(),
        deletionStatus: 'pending',
    }, { merge: true });
}
//# sourceMappingURL=userModelService.js.map