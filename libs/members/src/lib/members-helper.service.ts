import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class MembersHelperService {
    private readonly isEmployeeActive$ = new BehaviorSubject<string>("");
    employeeStatus$ = this.isEmployeeActive$.asObservable();
    private readonly isTpiAccount$ = new BehaviorSubject<boolean>(false);
    isTpiAccountStatus$ = this.isTpiAccount$.asObservable();

    constructor() {}
    /**
     * update employee status
     * @param value employee status value
     */
    updateEmployeeStatus(value: string): void {
        this.isEmployeeActive$.next(value);
    }
    /**
     * fetch employee status
     * @returns observable of employee status
     */
    getEmployeeStatus(): Observable<string> {
        return this.employeeStatus$;
    }
    /**
     * Set the values of the permissions so the could be accessed from other components
     */
    setTpiAccountStatus(tpiAccount: boolean): void {
        this.isTpiAccount$.next(tpiAccount);
    }
}
