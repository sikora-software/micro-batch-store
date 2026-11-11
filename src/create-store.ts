import type { Effect, Listener, Middleware, Reducer, Selector, Store } from './types';

export const createStore = <S, A>(reducer: Reducer<S, A>, initialState: S): Store<S, A> => {
  let currentState = initialState;

  const listeners = new Set<Listener<S>>();
  const middlewares: Middleware<S, A>[] = [];
  const effects = new Set<Effect<S, A>>();

  let batchPrevState = initialState;
  let hasPendingBatch = false;
  let notifyScheduled = false;
  let isDispatching = false;
  const actionQueue: A[] = [];

  const flushNotify = (): void => {
    notifyScheduled = false;
    if (!hasPendingBatch) return;

    const previousState = batchPrevState;
    const state = currentState;
    batchPrevState = state;
    hasPendingBatch = false;

    if (previousState !== state) listeners.forEach((listener) => listener(state, previousState));
  };

  const scheduleNotify = (): void => {
    if (notifyScheduled) return;
    notifyScheduled = true;
    queueMicrotask(flushNotify);
  };

  const getState = (): S => currentState;

  const dispatch = (action: A): void => {
    actionQueue.push(action);
    if (isDispatching) return;

    isDispatching = true;
    try {
      for (const queuedAction of actionQueue) {
        const previousState = currentState;

        if (!hasPendingBatch) {
          batchPrevState = previousState;
          hasPendingBatch = true;
        }
        currentState = reducer(currentState, queuedAction);
        scheduleNotify();

        middlewares.forEach((middleware) => middleware(queuedAction, currentState, previousState));
        effects.forEach((effect) => effect(queuedAction, currentState, previousState, { dispatch, getState }));
      }
    } catch (error) {
      actionQueue.length = 0;
      throw error;
    } finally {
      actionQueue.length = 0;
      isDispatching = false;
    }
  };

  const subscribe = (listener: Listener<S>): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const select = <T>(selector: Selector<S, T>, listener: (value: T, previousValue: T) => void): (() => void) =>
    subscribe((state, previousState) => {
      const previousValue = selector(previousState);
      const value = selector(state);
      if (!Object.is(value, previousValue)) listener(value, previousValue);
    });

  const addMiddleware = (middleware: Middleware<S, A>): void => {
    middlewares.push(middleware);
  };

  const addEffect = (effect: Effect<S, A>): (() => void) => {
    effects.add(effect);
    return () => effects.delete(effect);
  };

  return { getState, dispatch, subscribe, select, addMiddleware, addEffect };
};
