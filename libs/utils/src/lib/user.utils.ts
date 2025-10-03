import { IUserResponse } from '@clientfuse/models';

export const noUserEmailPrefix = 'no-user-email-';
export const getNoEmailPlaceholder = () => `${noUserEmailPrefix}${Date.now()}@connectly.io`;
export const checkIfNoUserEmail = (email: string | undefined): boolean => !!email?.startsWith(noUserEmailPrefix);

export function canDisconnectPlatform(user: IUserResponse): boolean {
  return user.isLoggedInWithFacebook && user.isLoggedInWithGoogle;
}

export function generateStrongPassword(length = 16): string {
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:\',.<>?/`~';
  const allChars = upperCaseChars + lowerCaseChars + numbers + specialChars;

  const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  let password = getRandomChar(upperCaseChars) +
    getRandomChar(lowerCaseChars) +
    getRandomChar(numbers) +
    getRandomChar(specialChars);

  while (password.length < length) {
    password += getRandomChar(allChars);
  }

  password = password.split('').sort(() => Math.random() - 0.5).join('');
  return password;
}
