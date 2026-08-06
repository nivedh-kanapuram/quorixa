export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly data?: unknown;

  constructor(message: string, statusCode = 500, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
