import type { Listener, Middleware, Reducer, Store } from './types';

export const createStore = <S, A>(reducer: Reducer<S, A>, initialState: S): Store<S, A> => {
  let currentState = initialState;

  const listeners = new Set<Listener<S>>();
  const middlewares: Middleware<S, A>[] = [];

  let batchPrevState: S | null = null;
  let notifyScheduled = false;

  const flushNotify = (): void => {
    notifyScheduled = false;
    const prev = batchPrevState!;
    batchPrevState = null;

    if (prev === currentState) return;

    const snapshot = currentState;
    listeners.forEach((listener) => listener(snapshot, prev));
  };

  const scheduleNotify = (): void => {
    if (notifyScheduled) return;
    notifyScheduled = true;
    queueMicrotask(flushNotify);
  };

  const getState = (): S => currentState;

  const dispatch = (action: A): void => {
    const prevState = currentState;

    batchPrevState ??= prevState;

    currentState = reducer(currentState, action);

    middlewares.forEach((mw) => mw(action, currentState, prevState));

    scheduleNotify();
  };

  const subscribe = (listener: Listener<S>): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const addMiddleware = (middleware: Middleware<S, A>): void => {
    middlewares.push(middleware);
  };

  return { getState, dispatch, subscribe, addMiddleware };
};
