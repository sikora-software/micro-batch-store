# micro-batch-store

[![npm version](https://img.shields.io/npm/v/micro-batch-store.svg?style=flat-square)](https://www.npmjs.com/package/micro-batch-store)
[![license](https://img.shields.io/npm/l/micro-batch-store.svg?style=flat-square)](https://github.com/sikora-software/micro-batch-store/blob/main/LICENSE)

**Minimal Redux-like state store with microtask-batched subscriber notifications.**

`micro-batch-store` separates state updates from subscriber notifications. State changes synchronously when `dispatch()` is called, but subscriber notifications are queued via `queueMicrotask()`. Multiple synchronous dispatches produce a single subscriber execution containing the final state.

---

## Why use it?

- **Zero dependencies** — Small footprint for lightweight apps or embedded utilities.
- **Automatic batching** — Eliminates re-render cascades from rapid synchronous updates.
- **Synchronous state reads** — `store.getState()` always reflects the latest state immediately.
- **TypeScript native** — Typed state, actions, reducers, and middleware out of the box.

---

## Installation

```bash
npm install micro-batch-store
```

---

## Basic Usage

```ts
import { createStore, type Reducer } from 'micro-batch-store';

type State = number;
type Action = { type: 'INCREMENT' } | { type: 'DECREMENT' };

const reducer: Reducer<State, Action> = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
};

const store = createStore(reducer, 0);

store.subscribe((state, previousState) => {
  console.log(`State changed from ${previousState} to ${state}`);
});

// Dispatch multiple actions synchronously
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });

// Subscribers fire ONCE at the end of the microtask:
// -> "State changed from 0 to 3"
```

### Immediate State Reading

State updates synchronously on `dispatch()`, even though subscriber notifications are deferred:

```ts
store.dispatch({ type: 'INCREMENT' });

// Always returns the latest state immediately (1)
console.log(store.getState());
```

### Middleware

```ts
store.addMiddleware((action, nextState, previousState) => {
  console.log(`Action: ${action.type}`, previousState, '->', nextState);
});
```

---

## Author

Created and maintained by [Mateusz Sikora](https://sikora.software).

## License

MIT
