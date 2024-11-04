import { of } from "rxjs";

export const mockStore = {
    selectSnapshot: () => of(""),
    dispatch: () => of({}),
    select: () => of({}),
    selectOnce: () => of({}),
};
