import { CoreError, RequestInputError, UnrecoverableServerError, NotFoundError, InvalidHandlerError } from '../src/error';

describe('CoreError', () => {
  it('should create a CoreError with correct properties', () => {
    const error = new CoreError('Test message', 'TestCode', 500);

    expect(error.message).toBe('Test message');
    expect(error.errorCode).toBe('TestCode');
    expect(error.errorStatusCode).toBe(500);
    expect(error).toBeInstanceOf(Error);
  });

  it('should generate correct response object', () => {
    const error = new CoreError('Test message', 'TestCode', 500);
    const response = error.makeResponse();

    expect(response).toEqual({
      status: 500,
      jsonBody: {
        error: {
          code: 'TestCode',
          message: 'Test message',
        },
      },
    });
  });
});

describe('RequestInputError', () => {
  it('should create with default values', () => {
    const error = new RequestInputError('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.errorCode).toBe('RequestInputError');
    expect(error.errorStatusCode).toBe(400);
  });

  it('should create with custom values', () => {
    const error = new RequestInputError('Custom message', 'CustomCode', 422);

    expect(error.message).toBe('Custom message');
    expect(error.errorCode).toBe('CustomCode');
    expect(error.errorStatusCode).toBe(422);
  });

  it('should extend CoreError', () => {
    const error = new RequestInputError('Test');
    expect(error).toBeInstanceOf(CoreError);
  });

  it('should generate correct response', () => {
    const error = new RequestInputError('Bad request');
    const response = error.makeResponse();

    expect(response).toEqual({
      status: 400,
      jsonBody: {
        error: {
          code: 'RequestInputError',
          message: 'Bad request',
        },
      },
    });
  });
});

describe('UnrecoverableServerError', () => {
  it('should create with default values', () => {
    const error = new UnrecoverableServerError('Server error');

    expect(error.message).toBe('Server error');
    expect(error.errorCode).toBe('UnrecoverableServerError');
    expect(error.errorStatusCode).toBe(400);
  });

  it('should create with custom values', () => {
    const error = new UnrecoverableServerError('Custom message', 'CustomCode', 403);

    expect(error.message).toBe('Custom message');
    expect(error.errorCode).toBe('CustomCode');
    expect(error.errorStatusCode).toBe(403);
  });

  it('should extend CoreError', () => {
    const error = new UnrecoverableServerError('Test');
    expect(error).toBeInstanceOf(CoreError);
  });

  it('should use 400 status by default to prevent retries', () => {
    const error = new UnrecoverableServerError('Test');
    expect(error.errorStatusCode).toBe(400);
  });
});

describe('NotFoundError', () => {
  it('should create with default values', () => {
    const error = new NotFoundError('Resource not found');

    expect(error.message).toBe('Resource not found');
    expect(error.errorCode).toBe('NotFoundError');
    expect(error.errorStatusCode).toBe(404);
  });

  it('should create with custom values', () => {
    const error = new NotFoundError('Custom message', 'CustomCode', 410);

    expect(error.message).toBe('Custom message');
    expect(error.errorCode).toBe('CustomCode');
    expect(error.errorStatusCode).toBe(410);
  });

  it('should extend CoreError', () => {
    const error = new NotFoundError('Test');
    expect(error).toBeInstanceOf(CoreError);
  });
});

describe('InvalidHandlerError', () => {
  it('should create with default values', () => {
    const error = new InvalidHandlerError('Invalid handler');

    expect(error.message).toBe('Invalid handler');
    expect(error.errorCode).toBe('InvalidHandler');
    expect(error.errorStatusCode).toBe(400);
  });

  it('should create with custom values', () => {
    const error = new InvalidHandlerError('Custom message', 'CustomCode', 422);

    expect(error.message).toBe('Custom message');
    expect(error.errorCode).toBe('CustomCode');
    expect(error.errorStatusCode).toBe(422);
  });

  it('should extend CoreError', () => {
    const error = new InvalidHandlerError('Test');
    expect(error).toBeInstanceOf(CoreError);
  });
});
