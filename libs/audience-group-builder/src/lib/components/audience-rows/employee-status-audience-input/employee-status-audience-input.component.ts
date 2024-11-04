import { Validators, FormControl, FormGroup, AbstractControl } from "@angular/forms";
import { FormBuilder } from "@angular/forms";
import { EventEmitter, Output, OnDestroy } from "@angular/core";
import { Component, OnInit, Input } from "@angular/core";
import { AudienceInput } from "../AudienceInput";
import { EmploymentStatusAudience, AudienceType } from "@empowered/api";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { EmploymentStatus } from "@empowered/api";
import { map, distinctUntilChanged, startWith, tap, shareReplay } from "rxjs/operators";
import { Observable, Subscription } from "rxjs";

@Component({
    selector: "empowered-employee-status-audience-input",
    templateUrl: "./employee-status-audience-input.component.html",
    styleUrls: ["./employee-status-audience-input.component.scss"],
})
export class EmployeeStatusAudienceInputComponent extends AudienceInput<EmploymentStatusAudience> implements OnInit, OnDestroy {
    @Input() isActive = false;
    @Input() isTerminated = false;

    @Output() selectedStatuses: EventEmitter<EmploymentStatus[]> = new EventEmitter();
    selectedStatusValues: EmploymentStatus[] = [];

    employeeStatusFormControl: FormControl = this.formBuilder.control(this.selectedStatusValues, Validators.required);

    active: FormControl;
    terminated: FormControl;

    checkboxGroup: FormGroup = this.formBuilder.group({});

    isValid$: Observable<boolean> = this.employeeStatusFormControl.valueChanges.pipe(
        map((values) => this.employeeStatusFormControl.status === "VALID"),
        distinctUntilChanged(),
        startWith(this.employeeStatusFormControl.valid),
        shareReplay(1),
    );

    subscriptions: Subscription[] = [];

    isSubmitEventFired = false;

    constructor(private readonly formBuilder: FormBuilder) {
        super();
    }

    ngOnInit(): void {
        this.active = this.formBuilder.control(this.isActive, this.checkboxValidator.bind(this));
        this.terminated = this.formBuilder.control(this.isTerminated, this.checkboxValidator.bind(this));
        this.checkboxGroup = this.formBuilder.group({
            active: this.active,
            terminated: this.terminated,
        });
        this.subscriptions.push(this.submitEvent$.pipe(tap((result) => (this.isSubmitEventFired = true))).subscribe());
    }

    // Initializer function not used
    setInitializerData(): void {}

    setValue(values: EmploymentStatusAudience[]): void {
        values.forEach((status) => {
            switch (status.status) {
                case EmploymentStatus.ACTIVE:
                    this.isActive = true;
                    break;
                case EmploymentStatus.TERMINATED:
                    this.isTerminated = true;
                    break;
            }
        });

        this.setCurrentValues();
    }

    getMappedControlValueChanges(): Observable<EmploymentStatusAudience[]> {
        return this.selectedStatuses
            .asObservable()
            .pipe(map((statuses) => statuses.map((status) => ({ type: "EMPLOYMENT_STATUS" as AudienceType, status: status }))));
    }

    onChangeActive(event: MatCheckboxChange): void {
        this.isActive = event.checked;
        this.setCurrentValues();
    }

    onChangeTerminated(event: MatCheckboxChange): void {
        this.isTerminated = event.checked;
        this.setCurrentValues();
    }

    checkboxValidator(control: AbstractControl): { [key: string]: boolean } | null {
        return this.isSubmitEventFired && this.active && this.terminated && !this.active.value && !this.terminated.value
            ? { required: true }
            : null;
    }

    private setCurrentValues(): void {
        this.selectedStatusValues = [];
        if (this.isActive) {
            this.selectedStatusValues.push(EmploymentStatus.ACTIVE);
        }
        if (this.isTerminated) {
            this.selectedStatusValues.push(EmploymentStatus.TERMINATED);
        }
        this.selectedStatuses.emit(this.selectedStatusValues);
        this.employeeStatusFormControl.setValue(this.selectedStatusValues);
    }
    validate(): void {
        this.employeeStatusFormControl.updateValueAndValidity();
        this.active.updateValueAndValidity();
        this.terminated.updateValueAndValidity();
        this.isSubmitEventFired = false;
    }
    isValid(): Observable<boolean> {
        return this.isValid$;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
