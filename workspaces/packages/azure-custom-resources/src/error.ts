export class CoreError extends Error {
  constructor(message: string, public errorCode: string, public errorStatusCode: number) {
    super(message);
  }

  makeResponse() {
    return {
      status: this.errorStatusCode,
      jsonBody: {
        error: {
          code: this.errorCode,
          message: this.message,
        },
      },
    };
  }
}

export class RequestInputError extends CoreError {
  constructor(message: string, public errorCode: string = 'RequestInputError', public errorStatusCode: number = 400) {
    super(message, errorCode, errorStatusCode);
  }
}

export class NotFoundError extends CoreError {
  constructor(message: string, public errorCode: string = 'NotFoundError', public errorStatusCode: number = 404) {
    super(message, errorCode, errorStatusCode);
  }
}

export class InvalidHandlerError extends CoreError {
  constructor(message: string, public errorCode: string = 'InvalidHandler', public errorStatusCode: number = 404) {
    super(message, errorCode, errorStatusCode);
  }
}
