// Error type that carries an HTTP status and a safe message for the client.
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra; // for example { fields: {...} } or { session: ... }
  }
}

// Validate input with a zod schema. Throws a 400 with a `fields` object.
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : '_form';
    if (!fields[key]) fields[key] = issue.message;
  }
  throw new HttpError(400, 'Please check the highlighted fields.', { fields });
}

// Positive whole number from a URL parameter, or null.
export function parseId(value) {
  return /^[1-9]\d{0,15}$/.test(String(value)) ? Number(value) : null;
}

export function notFound() {
  return new HttpError(404, 'Not found.');
}

export function errorHandler(logger = console) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, ...err.extra });
    }
    if (err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'That request is too large.' });
    }
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'The request could not be read.' });
    }
    // Never send internals to the client. Never log bodies, cookies, or tokens.
    logger.error(`[error] ${req.method} ${req.path}: ${err && err.message}`);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  };
}
