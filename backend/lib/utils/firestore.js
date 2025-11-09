"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTimestamp = toTimestamp;
exports.nowTimestamp = nowTimestamp;
const firebase_1 = require("../config/firebase");
function toTimestamp(date) {
    if (date instanceof Date) {
        return firebase_1.admin.firestore.Timestamp.fromDate(date);
    }
    if (typeof date === 'string') {
        return firebase_1.admin.firestore.Timestamp.fromDate(new Date(date));
    }
    return firebase_1.admin.firestore.Timestamp.fromMillis(date);
}
function nowTimestamp() {
    return firebase_1.admin.firestore.FieldValue.serverTimestamp();
}
//# sourceMappingURL=firestore.js.map