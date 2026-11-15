/** Operational error with an HTTP status. Thrown by services, rendered by the error handler. */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
  static badRequest(msg, details) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'Authentication required') { return new AppError(401, msg); }
  static forbidden(msg = 'You do not have permission to do that') { return new AppError(403, msg); }
  static notFound(msg = 'Resource not found') { return new AppError(404, msg); }
  static conflict(msg) { return new AppError(409, msg); }
}
