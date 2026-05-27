import { describe, it, expect, vi } from 'vitest';
import { createStore, Reducer } from '../index';

describe('micro-batch-store core', () => {
  type State = { count: number };
  type Action = { type: 'INCREMENT' } | { type: 'DECREMENT' } | { type: 'SET'; value: number };

  const reducer: Reducer<State, Action> = (state, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
      case 'SET':
        return state.count === action.value ? state : { count: action.value };
      default:
        return state;
    }
  };

  it('should update state synchronously', () => {
    const store = createStore(reducer, { count: 0 });
    store.dispatch({ type: 'INCREMENT' });
    expect(store.getState().count).toBe(1);
  });

  it('should batch multiple notifications into a single microtask', async () => {
    const store = createStore(reducer, { count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });

    expect(store.getState().count).toBe(3);

    expect(listener).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 3 }, { count: 0 });
  });

  it('should not notify if the state has not changed', async () => {
    const store = createStore(reducer, { count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.dispatch({ type: 'SET', value: 0 });

    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });

  it('should support middleware and execute it synchronously', () => {
    const store = createStore(reducer, { count: 0 });
    const middleware = vi.fn();
    store.addMiddleware(middleware);

    store.dispatch({ type: 'INCREMENT' });

    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith({ type: 'INCREMENT' }, { count: 1 }, { count: 0 });
  });

  it('should allow unsubscribing', async () => {
    const store = createStore(reducer, { count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.dispatch({ type: 'INCREMENT' });

    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });
});
