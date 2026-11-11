import type { Selector } from './types';

type InputSelector = Selector<never, unknown>;
type SelectorState<TSelector> = TSelector extends Selector<infer State, unknown> ? State : never;
type SelectorValues<TSelectors extends readonly InputSelector[]> = {
  [Index in keyof TSelectors]: ReturnType<TSelectors[Index]>;
};

export const createSelector = <const TSelectors extends readonly InputSelector[], TResult>(
  inputSelectors: TSelectors,
  resultFunction: (...inputs: SelectorValues<TSelectors>) => TResult,
): Selector<SelectorState<TSelectors[0]>, TResult> => {
  let previousInputs: readonly unknown[] | null = null;
  let previousResult!: TResult;

  return (state: SelectorState<TSelectors[0]>): TResult => {
    const inputs = inputSelectors.map((selector) => selector(state as never));
    const hasSameInputs =
      previousInputs !== null &&
      inputs.length === previousInputs.length &&
      inputs.every((input, index) => Object.is(input, previousInputs?.[index]));

    if (hasSameInputs) return previousResult;

    const result = resultFunction(...(inputs as SelectorValues<TSelectors>));
    previousInputs = inputs;
    previousResult = result;
    return result;
  };
};
