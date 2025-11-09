import { admin } from '../config/firebase';

export function toTimestamp(date: Date | string | number) {
  if (date instanceof Date) {
    return admin.firestore.Timestamp.fromDate(date);
  }
  if (typeof date === 'string') {
    return admin.firestore.Timestamp.fromDate(new Date(date));
  }
  return admin.firestore.Timestamp.fromMillis(date);
}

export function nowTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

