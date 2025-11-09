"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrivacySettings = getPrivacySettings;
exports.updatePrivacySettings = updatePrivacySettings;
exports.requestDataExport = requestDataExport;
exports.requestAccountDeletion = requestAccountDeletion;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const userModelService_1 = require("./userModelService");
const USER_SETTINGS_COLLECTION = 'userSettings';
const PRIVACY_EXPORTS_COLLECTION = 'dataExports';
async function getPrivacySettings(userId) {
    const doc = await firebase_1.db.collection(USER_SETTINGS_COLLECTION).doc(userId).get();
    return doc.data() || null;
}
async function updatePrivacySettings(userId, settings) {
    const ref = firebase_1.db.collection(USER_SETTINGS_COLLECTION).doc(userId);
    await ref.set({
        userId,
        privacy: settings,
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return (await ref.get()).data();
}
async function requestDataExport(userId, channels = ['download']) {
    const ref = firebase_1.db.collection(PRIVACY_EXPORTS_COLLECTION).doc();
    await ref.set({
        userId,
        status: 'queued',
        channels,
        createdAt: (0, firestore_1.nowTimestamp)(),
        updatedAt: (0, firestore_1.nowTimestamp)(),
    });
    return { requestId: ref.id };
}
async function requestAccountDeletion(userId) {
    await (0, userModelService_1.flagUserForDeletion)(userId);
}
//# sourceMappingURL=privacyService.js.map