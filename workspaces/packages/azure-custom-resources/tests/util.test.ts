import { Duration } from '../src/util';

describe('Duration', () => {
  describe('seconds', () => {
    it('should create a Duration from seconds', () => {
      const duration = Duration.seconds(30);
      expect(duration.seconds()).toBe(30);
      expect(duration.milliseconds()).toBe(30000);
    });

    it('should handle zero seconds', () => {
      const duration = Duration.seconds(0);
      expect(duration.seconds()).toBe(0);
      expect(duration.milliseconds()).toBe(0);
    });

    it('should handle fractional seconds', () => {
      const duration = Duration.seconds(1.5);
      expect(duration.seconds()).toBe(2); // Ceiling
      expect(duration.milliseconds()).toBe(1500);
    });
  });

  describe('minutes', () => {
    it('should create a Duration from minutes', () => {
      const duration = Duration.minutes(2);
      expect(duration.minutes()).toBe(2);
      expect(duration.seconds()).toBe(120);
      expect(duration.milliseconds()).toBe(120000);
    });

    it('should handle zero minutes', () => {
      const duration = Duration.minutes(0);
      expect(duration.minutes()).toBe(0);
      expect(duration.seconds()).toBe(0);
      expect(duration.milliseconds()).toBe(0);
    });

    it('should handle fractional minutes', () => {
      const duration = Duration.minutes(1.5);
      expect(duration.minutes()).toBe(2); // Ceiling
      expect(duration.seconds()).toBe(90);
      expect(duration.milliseconds()).toBe(90000);
    });
  });

  describe('conversions', () => {
    it('should correctly convert between units', () => {
      const duration = Duration.seconds(125);
      expect(duration.milliseconds()).toBe(125000);
      expect(duration.seconds()).toBe(125);
      expect(duration.minutes()).toBe(3); // Ceiling of 125/60
    });

    it('should use ceiling for unit conversions', () => {
      const duration = Duration.seconds(61);
      expect(duration.minutes()).toBe(2); // Ceiling of 61/60
    });

    it('should handle exact conversions', () => {
      const duration = Duration.minutes(1);
      expect(duration.seconds()).toBe(60);
      expect(duration.milliseconds()).toBe(60000);
    });
  });

  describe('edge cases', () => {
    it('should handle very small durations', () => {
      const duration = Duration.seconds(0.001);
      expect(duration.milliseconds()).toBe(1);
      expect(duration.seconds()).toBe(1); // Ceiling
      expect(duration.minutes()).toBe(1); // Ceiling
    });

    it('should handle large durations', () => {
      const duration = Duration.minutes(1000);
      expect(duration.minutes()).toBe(1000);
      expect(duration.seconds()).toBe(60000);
      expect(duration.milliseconds()).toBe(60000000);
    });
  });
});
