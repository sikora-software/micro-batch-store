import { describe, it, expect } from 'vitest';
import { version } from './index';

describe('Initial Setup', () => {
  it('should have a version defined', () => {
    expect(version).toBe('0.0.1');
  });
});
