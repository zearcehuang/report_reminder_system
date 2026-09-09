/**
 * RFC 7807 Problem Details representation for standardized HTTP API error responses.
 * Provides compatibility fields (success: false, error: message) for seamless legacy frontend interop.
 */

function getTitleForStatus(status) {
  switch (status) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    case 429: return 'Too Many Requests';
    case 500: return 'Internal Server Error';
    case 503: return 'Service Unavailable';
    default: return 'HTTP Error';
  }
}

function createProblemDetails({
  type = 'about:blank',
  title,
  status = 500,
  detail,
  instance,
  errors = null,
  extensions = {}
}) {
  const resolvedTitle = title || getTitleForStatus(status);
  const resolvedDetail = detail || resolvedTitle;

  const problem = {
    // RFC 7807 standard properties
    type,
    title: resolvedTitle,
    status,
    detail: resolvedDetail,
    instance: instance || null,
    // Backward-compatibility properties
    success: false,
    error: resolvedDetail,
    timestamp: new Date().toISOString(),
    ...extensions
  };

  if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
    problem.errors = errors;
  }

  return problem;
}

module.exports = {
  createProblemDetails,
  getTitleForStatus
};
