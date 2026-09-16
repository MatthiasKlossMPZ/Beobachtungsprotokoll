export const MIN_PASSWORD_LENGTH = 12;

export function getPasswordChecks(password = '') {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-ZÄÖÜ]/.test(password),
    lower: /[a-zäöüß]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-zÄÖÜäöüß0-9]/.test(password),
  };
}

export function validatePassword(password = '') {
  const checks = getPasswordChecks(password);
  const ok = Object.values(checks).every(Boolean);

  const missing = [];
  if (!checks.length) missing.push(`mindestens ${MIN_PASSWORD_LENGTH} Zeichen`);
  if (!checks.upper) missing.push('einen Großbuchstaben');
  if (!checks.lower) missing.push('einen Kleinbuchstaben');
  if (!checks.digit) missing.push('eine Ziffer');
  if (!checks.special) missing.push('ein Sonderzeichen');

  return {
    ok,
    checks,
    message: ok
      ? ''
      : `Das Passwort muss ${missing.join(', ')} enthalten.`,
  };
}
