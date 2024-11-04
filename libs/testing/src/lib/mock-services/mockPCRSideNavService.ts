import { Subject } from "rxjs";

export const mockPCRSideNavService = {
    removeTransactionScreenFromStore: (submitFlag: boolean) => {},
    policyFlow$: new Subject<any>(),
    getPolicyHolderName: () => "",
};
