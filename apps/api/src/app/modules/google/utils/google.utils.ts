import { DateTime } from 'luxon';

export const getGoogleTokenExpirationDate = (expiryDate: number | null): Date => {
  return expiryDate
    ? DateTime.fromMillis(expiryDate).toJSDate()
    : DateTime.now().plus({ hours: 1 }).toJSDate();
};
