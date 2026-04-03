export function validateProfile(name: string) {
  if (!name || name.length < 2) {
    throw new Error('Invalid name');
  }
}
