/**
 * Small HTTP helpers shared by every route.
 */

/** An error with an intended status code, thrown from anywhere in a handler. */
export class HttpError extends Error {
  constructor(status, message, { field = null, code = null } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.field = field;
    this.code = code;
  }
}

export const badRequest = (message, field) => new HttpError(400, message, { field });
export const unauthorized = (message = "Not signed in") => new HttpError(401, message);
export const forbidden = (message = "Not allowed") => new HttpError(403, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message, field) => new HttpError(409, message, { field });

/**
 * Wraps an async handler so a rejected promise reaches Express's error
 * middleware instead of becoming an unhandled rejection.
 */
export function route(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
