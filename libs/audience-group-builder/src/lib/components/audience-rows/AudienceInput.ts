import { Injectable, OnDestroy } from "@angular/core";
import { AbstractAudience } from "@empowered/api";
import { Observable, Subscription } from "rxjs";
import { tap, switchMap } from "rxjs/operators";

@Injectable()
export abstract class AudienceInput<T extends AbstractAudience> implements OnDestroy {
    submitEvent$: Observable<void>;
    subs: Subscription[] = [];
    validOnSubmit$: Observable<boolean>;
    ngOnDestroy(): void {
        this.subs.forEach((element) => element.unsubscribe());
    }
    /**
     * Optionally overridable function to initialize the component with a certain value (intended for tiered list elements).
     * Default implementation is void
     * @param initData Data used to initialize the component with
     */
    abstract setInitializerData(initData: any): void;

    /**
     * Implementing classes must specify how to prepopulate their input
     * @param values value (or values) to set the input to
     */
    abstract setValue(values: T[]): void;

    /**
     * Implementing classes must map the valueChanges observable from the form to the generic type
     */
    abstract getMappedControlValueChanges(): Observable<T[]>;
    abstract validate(): void;
    abstract isValid(): Observable<boolean>;
    setSubmitEvent(submitEvent: Observable<void>): void {
        this.submitEvent$ = submitEvent.pipe(tap((event) => this.validate()));
        this.subs.push(this.submitEvent$.subscribe());
        this.validOnSubmit$ = this.submitEvent$.pipe(switchMap((res) => this.isValid()));
    }
}
