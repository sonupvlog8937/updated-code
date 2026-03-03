import crypto from 'crypto';

export const requestContext = (request, response, next) => {
  const incomingRequestId = request.headers['x-request-id'];
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : crypto.randomUUID();

  request.id = requestId;
  response.setHeader('x-request-id', requestId);

  next();
};