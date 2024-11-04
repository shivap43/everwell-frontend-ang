import { BehaviorSubject } from "rxjs";

export const mockAflacAlwaysHelperService = {
    noPoliciesFound$: new BehaviorSubject(false),
    saveAndSubmit$: new BehaviorSubject(false),
    isLoading$: () => {},
    hasClickedNext$: new BehaviorSubject(false),
};
