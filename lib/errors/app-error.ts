export class AppError extends Error {
  code: string;

  constructor(message: string, code = 'UNKNOWN') {
    super(message);
    this.code = code;
  }
}
