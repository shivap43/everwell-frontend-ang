import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class AccountNameUpdateService {
    accountName$ = new Subject();

    constructor() {}
}
