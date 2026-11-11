import { describe, expect, it, vi } from 'vitest';

import { createSelector } from '../create-selector';

describe('createSelector', () => {
  it('recomputes when an input changes and reuses the result otherwise', () => {
    type State = { values: number[]; label: string };
    const resultFunction = vi.fn((values: number[]) => values.filter((value) => value > 1));
    const selectValues = (state: State) => state.values;
    const selectFilteredValues = createSelector([selectValues], resultFunction);
    const values = [1, 2, 3];
    const firstState = { values, label: 'first' };
    const nextState = { values, label: 'second' };

    const firstResult = selectFilteredValues(firstState);
    const secondResult = selectFilteredValues(nextState);

    expect(secondResult).toBe(firstResult);
    expect(resultFunction).toHaveBeenCalledOnce();

    const changedResult = selectFilteredValues({ values: [...values, 4], label: 'second' });
    expect(changedResult).toEqual([2, 3, 4]);
    expect(resultFunction).toHaveBeenCalledTimes(2);
  });

  it('supports selectors with multiple inputs', () => {
    type State = { values: number[]; minimum: number };
    const selectValues = (state: State) => state.values;
    const selectMinimum = (state: State) => state.minimum;
    const selectFiltered = createSelector([selectValues, selectMinimum], (values, minimum) =>
      values.filter((value) => value >= minimum),
    );

    expect(selectFiltered({ values: [1, 2, 3], minimum: 2 })).toEqual([2, 3]);
  });
});
