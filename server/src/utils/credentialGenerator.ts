/**
 * Generates a dynamic Sub-Admin password matching the required format:
 * NEC@${Math.floor(Math.random() * 9999) + 9}SubAdmin
 */
export const generateSubAdminPassword = (): string => {
  const randNum = Math.floor(Math.random() * 9999) + 9;
  return `NEC@${randNum}SubAdmin`;
};

/**
 * Checks if a password strictly matches the required format:
 * NEC@<number>SubAdmin
 */
export const isSubAdminPasswordFormat = (pwd?: string): boolean => {
  if (!pwd || typeof pwd !== 'string') return false;
  return /^NEC@\d+SubAdmin$/.test(pwd.trim());
};

