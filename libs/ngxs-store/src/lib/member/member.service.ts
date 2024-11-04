import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AddMemberId, AddMpGroup, AddBeneficiaryValidators } from "./member.action";
import { Store } from "@ngxs/store";

@Injectable({
    providedIn: "root",
})
export class MemberBeneficiaryService {
    memberId = new BehaviorSubject<number>(null);
    mpGroup = new BehaviorSubject<number>(null);
    validators = new BehaviorSubject<any>(null);
    constructor(private store: Store) {
        this.memberId.subscribe((resp) => {
            this.store.dispatch(new AddMemberId(resp));
        });
        this.mpGroup.subscribe((resp) => {
            this.store.dispatch(new AddMpGroup(resp));
        });
        this.validators.subscribe((resp) => {
            this.store.dispatch(new AddBeneficiaryValidators(resp));
        });
    }
}
