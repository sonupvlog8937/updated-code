const STATUS_CODE_FALLBACK = 500;

export const notFoundHandler = (request, response) => {
  response.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${request.method} ${request.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
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

  if (isServerError) {
    console.error(`[${request.id}]`, error);
  }

  response.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Something went wrong',
      code: error.code || (isServerError ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED'),
    },
    requestId: request.id,
  });
};