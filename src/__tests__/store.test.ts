import { describe, it, expect, vi } from 'vitest';

import { createStore } from '../create-store';
import type { EffectContext, Reducer } from '../types';

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

  it('should run effects once per action in dispatch order', () => {
    const store = createStore(reducer, { count: 0 });
    const effect = vi.fn(
      (_action: Action, _state: State, _previous: State, _context: EffectContext<State, Action>) => 0,
    );
    const removeEffect = store.addEffect(effect);

    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });

    expect(store.getState().count).toBe(2);
    expect(effect).toHaveBeenCalledTimes(2);
    expect(effect.mock.calls[0]?.slice(0, 3)).toEqual([{ type: 'INCREMENT' }, { count: 1 }, { count: 0 }]);
    expect(effect.mock.calls[1]?.slice(0, 3)).toEqual([{ type: 'INCREMENT' }, { count: 2 }, { count: 1 }]);
    removeEffect();
  });

  it('should queue effect-dispatched actions until all effects finish for the current action', () => {
    const store = createStore(reducer, { count: 0 });
    const order: string[] = [];
    store.addEffect((action, state, _previous, context) => {
      order.push(`first:${action.type}`);
      if (action.type === 'INCREMENT') context.dispatch({ type: 'SET', value: state.count + 1 });
    });
    store.addEffect((action) => order.push(`second:${action.type}`));

    store.dispatch({ type: 'INCREMENT' });

    expect(store.getState().count).toBe(2);
    expect(order).toEqual(['first:INCREMENT', 'second:INCREMENT', 'first:SET', 'second:SET']);
  });

  it('should run action effects when the reducer leaves state unchanged', async () => {
    const store = createStore(reducer, { count: 0 });
    const effect = vi.fn();
    const listener = vi.fn();
    store.addEffect(effect);
    store.subscribe(listener);

    store.dispatch({ type: 'SET', value: 0 });

    expect(effect).toHaveBeenCalledOnce();

    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });

  it('should select derived values from batched state updates', async () => {
    const store = createStore(reducer, { count: 0 });
    const listener = vi.fn();
    store.select((state) => state.count % 2, listener);

    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'INCREMENT' });
    expect(listener).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(1, 0);
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
