import { Input, Directive, OnInit, ElementRef, OnDestroy } from "@angular/core";
import { NgControl } from "@angular/forms";
import { Store } from "@ngxs/store";
import { tap, takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { InputService } from "../services/input.service";

@Directive({
    selector: "[empoweredInput]",
})
export class InputDirective implements OnInit, OnDestroy {
    private _domOrder: string;
    private _formName: string;
    private readonly UNIQUE_ID_VARIANT = 1000000;
    private readonly labelId: string = Math.floor(Math.random() * this.UNIQUE_ID_VARIANT).toString();

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly inputService: InputService,
        private readonly control: NgControl,
        private readonly el: ElementRef,
        private readonly store: Store,
    ) {}

    /**
     * Passes a value to the component to track what order the input or select field is in the form
     * @param order the order that the input or select is in the form
     */
    @Input()
    set displayOrder(order: string) {
        this._domOrder = order;
    }

    /**
     * Passes a value to the component to connect the field to a specific form
     * @param name the name of the form that the input/select field is associated with
     */
    @Input()
    set formName(formName: string) {
        this._formName = formName;
    }
    /**
     * Creates multiple observables to track changes to the formControl, update the input store, and a listener for change in the form store
     */
    ngOnInit(): void {
        const formControl = this.control.control;

        formControl.valueChanges
            .pipe(
                tap(() => {
                    this.inputService.updateInputStore$(formControl, this.labelId, this._formName, this._domOrder);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.inputService.updateInputStore$(formControl, this.labelId, this._formName, this._domOrder);

        this.inputService.applyFocus$(this._domOrder, this.el).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * Unsubscribes the input and error observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
