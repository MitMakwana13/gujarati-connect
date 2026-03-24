export function handleError(error: any): string {
  console.error(error);

  if (error?.message) {
    return error.message;
  }

  return 'Something went wrong';
}
