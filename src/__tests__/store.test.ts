import { describe, it, expect } from 'vitest';

import { createStore } from '../create-store';

describe('Store Implementation', () => {
  it('should create a store with initial state', () => {
    const store = createStore((s) => s, 0);
    expect(store.getState()).toBe(0);
  });
});
