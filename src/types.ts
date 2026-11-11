export type Listener<S> = (state: S, prevState: S) => void;
export type Middleware<S, A> = (action: A, state: S, prevState: S) => void;
export type EffectContext<S, A> = {
  dispatch: (action: A) => void;
  getState: () => S;
};
export type Effect<S, A> = (action: A, state: S, prevState: S, context: EffectContext<S, A>) => void;
export type Selector<S, T> = (state: S) => T;
export type SelectionListener<T> = (value: T, previousValue: T) => void;
export type Reducer<S, A> = (state: S, action: A) => S;

export type Store<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: Listener<S>) => () => void;
  select: <T>(selector: Selector<S, T>, listener: SelectionListener<T>) => () => void;
  addMiddleware: (middleware: Middleware<S, A>) => void;
  addEffect: (effect: Effect<S, A>) => () => void;
};
