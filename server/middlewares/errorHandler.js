import logger from "../config/logger.js";

const STATUS_CODE_FALLBACK = 500;

export const notFoundHandler = (request, response) => {
  response.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${request.method} ${request.originalUrl}`,
      code: "ROUTE_NOT_FOUND",
    },
    requestId: request.id,
  });
};

export const globalErrorHandler = (error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || STATUS_CODE_FALLBACK;
  const isServerError = statusCode >= 500;

  // Log server errors with full context
  if (isServerError) {
    logger.error(error.message, {
      requestId: request.id,
      stack: error.stack,
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      userId: request.userId || null,
    });
  }

  // Never expose stack traces in production
  const isDev = process.env.NODE_ENV !== "production";

  response.status(statusCode).json({
    success: false,
    error: {
      message: isServerError && !isDev
        ? "Something went wrong. Please try again later."
        : error.message || "Something went wrong",
      code: error.code || (isServerError ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED"),
      ...(isDev && isServerError ? { stack: error.stack } : {}),
    },
    requestId: request.id,
  });
};