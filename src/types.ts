export type Listener<S> = (state: S, prevState: S) => void;
export type Middleware<S, A> = (action: A, state: S, prevState: S) => void;
export type Reducer<S, A> = (state: S, action: A) => S;

export type Store<S, A> = {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: Listener<S>) => () => void;
  addMiddleware: (middleware: Middleware<S, A>) => void;
};
