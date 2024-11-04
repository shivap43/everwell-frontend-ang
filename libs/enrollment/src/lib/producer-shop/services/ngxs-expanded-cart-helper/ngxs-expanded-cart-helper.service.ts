import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { SetIsOpenEnrollment, SetQLE } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class NGXSExpandedCartHelperService {
    constructor(private readonly ngxsStore: Store) {}

    /**
     * Dispatches action to set QLE and Open enrollment data to Ngxs store
     * This store data is being used in expanded shopping cart and application flow
     * @param mpGroup - mp group
     * @param memberId - member id
     */
    setQLEAndOpenEnrollment(mpGroup: number, memberId: number): void {
        this.ngxsStore.dispatch(new SetIsOpenEnrollment(mpGroup, false, true));
        this.ngxsStore.dispatch(new SetQLE(memberId, mpGroup));
    }
}
