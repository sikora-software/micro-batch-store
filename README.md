# micro-batch-store

**Minimal Redux-like store with microtask-batched notifications.**

Multiple synchronous dispatches are coalesced — subscribers fire exactly once per microtask with the final state.

## The Idea

Modern applications often suffer from "notification spam" where multiple state updates in quick succession trigger redundant UI re-renders. `micro-batch-store` solves this by leveraging `queueMicrotask` to batch notifications.

Instead of notifying subscribers immediately on every `dispatch`, the store schedules a single notification to run at the end of the current execution cycle (the microtask queue). This ensures your UI only updates once with the final computed state, no matter how many actions were dispatched synchronously.

## Why use this?

- **Zero Overhead State Management**: Perfect for lightweight websites that need a structured state container without the bundle size of Redux or other heavy libraries.
- **Performance by Default**: Automatically prevents "re-render storms" by batching updates out of the box.
- **Microscopic Footprint**: Designed to keep your bundle lean while providing the familiar Redux pattern.

## Features

- **Coalesced Notifications**: Multiple `dispatch` calls in the same microtask trigger only one notification to subscribers.
- **Middleware Support**: Synchronous middleware execution for side effects (like logging or URL syncing).
- **TypeScript First**: Full type safety for state, actions, and middleware.
- **Minimalist**: Tiny footprint with zero dependencies.

## Installation

```bash
npm install micro-batch-store
```

## Usage

```typescript
import { createStore, Reducer } from 'micro-batch-store';

type State = number;
type Action = { type: 'INCREMENT' } | { type: 'DECREMENT' };

const reducer: Reducer<State, Action> = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    default: return state;
  }
};

const store = createStore(reducer, 0);

store.subscribe((state, prevState) => {
  console.log(`State changed from ${prevState} to ${state}`);
});

// Multiple dispatches in the same microtask
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });

// Console will log only once: "State changed from 0 to 3"
```

## License

MIT
