export function generateStrongPassword(length: number = 16): string {
  const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()-_=+[]{}|;:\',.<>?/`~';
  const allChars = upperCaseChars + lowerCaseChars + numbers + specialChars;

  // Ensure the password contains at least one of each type
  const getRandomChar = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  let password = getRandomChar(upperCaseChars) +
    getRandomChar(lowerCaseChars) +
    getRandomChar(numbers) +
    getRandomChar(specialChars);

  // Fill the rest of the password with random characters from all types
  while (password.length < length) {
    password += getRandomChar(allChars);
  }

  // Shuffle the password to ensure randomness
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  return password;
}
