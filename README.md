# micro-batch-store

[![npm version](https://img.shields.io/npm/v/micro-batch-store.svg?style=flat-square)](https://www.npmjs.com/package/micro-batch-store)
[![license](https://img.shields.io/npm/l/micro-batch-store.svg?style=flat-square)](https://github.com/sikora-software/micro-batch-store/blob/main/LICENSE)

A small, dependency-free state store with synchronous reducers and action effects, plus microtask-batched subscriber notifications and selections.

## Installation

```sh
npm install micro-batch-store
```

## Quick start

```ts
import { createStore, type Reducer } from 'micro-batch-store';

type State = { count: number; color: string };
type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'GENERATE_RANDOM_COLOR' }
  | { type: 'SET_COLOR'; color: string };

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'GENERATE_RANDOM_COLOR':
      return state;
    case 'SET_COLOR':
      return state.color === action.color ? state : { ...state, color: action.color };
  }
};

const store = createStore(reducer, { count: 0, color: '#3366ff' });

store.subscribe((state, previousState) => {
  console.log(`${previousState.count} -> ${state.count}; color: ${state.color}`);
});

store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });

console.log(store.getState().count); // 2; state updates synchronously
// The subscriber runs once in a microtask with the final state.
```

## Dispatch and notification timing

Each dispatched action is reduced synchronously. Middleware then runs, followed by effects; handlers run in registration order within each group. Effects observe actions in dispatch order. `getState()` returns the state after the current action has been reduced.

Subscribers and selections are notified in a queued microtask. Synchronous dispatches before that microtask are treated as one state batch. Subscribers are skipped if the final state is the same object as the state at the start of the batch; selectors notify only when their selected values differ by `Object.is`.

If an effect dispatches another action, the store queues it until all middleware and effects for the current action have finished. Queued actions are reduced in order before the outermost `dispatch()` returns. This avoids recursive effect execution while preserving action order.

## Selecting state

Use `select()` to observe a value from state. The selector runs against the final and previous state once per committed batch; the listener runs only when the selected values differ by `Object.is`.

```ts
const unsubscribe = store.select(
  (state) => state.count,
  (count, previousCount) => {
    console.log(`${previousCount} -> ${count}`);
  },
);

unsubscribe();
```

### Memoized selectors

Use `createSelector()` when deriving a value is expensive or returns a new array or object. It reruns the result function only when one of its input selector results changes by `Object.is`.

```ts
import { createSelector } from 'micro-batch-store';

const selectCount = (state: State) => state.count;
const selectColor = (state: State) => state.color;

const selectSummary = createSelector([selectCount, selectColor], (count, color) => ({ count, color }));
```

Each selector instance keeps a one-entry cache. Keep input selectors focused on reading stable state values, and put the derived calculation in the result function.

## Middleware

Middleware runs synchronously after the reducer and before effects, once per dispatched action. Use it for cross-cutting action handling that does not need to dispatch a follow-up action.

```ts
store.addMiddleware((action, state, previousState) => {
  console.log(action.type, previousState, '->', state);
});
```

## Effects

Effects run synchronously after the reducer, once per dispatched action. They receive that action, the resulting state, the previous state, and a context with `dispatch()` and `getState()`. Use them for action-driven workflows and follow-up actions.

```ts
const removeEffect = store.addEffect((action, _state, _previousState, { dispatch }) => {
  if (action.type === 'GENERATE_RANDOM_COLOR') {
    dispatch({ type: 'SET_COLOR', color: createRandomColor() });
  }
});

removeEffect();

function createRandomColor(): string {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
}
```

The follow-up action is processed after the current action's middleware and effects finish. Subscribers then receive the resulting state once in their scheduled microtask. Use memoized selectors for derived state instead of dispatching duplicate derived data into the store.

## API

- `createStore(reducer, initialState)` creates a store.
- `getState()` returns the current state.
- `dispatch(action)` runs the reducer and action handlers synchronously, then schedules subscriber notification.
- `subscribe(listener)` listens for committed state batches.
- `select(selector, listener)` listens for changes to a selected value.
- `addMiddleware(middleware)` registers synchronous per-action middleware.
- `addEffect(effect)` registers a per-action effect and returns a removal function.
- `createSelector(inputs, result)` creates a memoized derived-state selector.

---

## Author

Created and maintained by [Mateusz Sikora](https://sikora.software).

## License

MIT
