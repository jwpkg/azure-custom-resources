export const asyncRequestTypeParam = 'async-request-type';
export const asyncRequestFirstEpochParam = 'async-request-firstEpoch';
export const asyncRequestRetryCountParam = 'async-request-retry-count';
export const asyncRequestIdParam = 'async-request-id';
export const asyncRequestPath = 'async-request-path';

export class Duration {
  private constructor(private $milliSeconds: number) {}

  static seconds(seconds: number) {
    return new Duration(seconds * 1000);
  }

  static minutes(minutes: number) {
    return new Duration(minutes * 60_000);
  }

  milliseconds() {
    return this.$milliSeconds;
  }

  seconds() {
    return Math.ceil(this.$milliSeconds * 1000);
  }

  minutes() {
    return Math.ceil(this.$milliSeconds * 60_000);
  }
}
