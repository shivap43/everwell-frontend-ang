import { EnrolledPlanAudience } from "@empowered/api";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { AudienceInput } from "../AudienceInput";
import { ChipData } from "@empowered/constants";
import { ChipSelectComponent } from "@empowered/ui";
import { BehaviorSubject, Observable } from "rxjs";
import { Store } from "@ngxs/store";
import { map, withLatestFrom, distinctUntilChanged, startWith, shareReplay } from "rxjs/operators";
import { BenefitsOfferingState } from "@empowered/ngxs-store";
import { FormGroup, FormControl, Validators, FormBuilder } from "@angular/forms";

@Component({
    selector: "empowered-product-audience-input",
    templateUrl: "./product-audience-input.component.html",
    styleUrls: ["./product-audience-input.component.scss"],
})
export class ProductAudienceInputComponent extends AudienceInput<EnrolledPlanAudience> implements OnInit, AfterViewInit {
    @ViewChild(ChipSelectComponent, { static: true }) chipSelect: ChipSelectComponent;

    private readonly contextSubject$: BehaviorSubject<number> = new BehaviorSubject(null);
    planChips$: Observable<ChipData[]> = this.store.select(BenefitsOfferingState.getPlanChoices).pipe(
        withLatestFrom(this.contextSubject$.asObservable()),
        map(([planChoices, contextProductId]) =>
            planChoices
                .filter((choice) => choice.plan.productId === contextProductId)
                // eslint-disable-next-line arrow-body-style
                .map((choice) => {
                    return { name: choice.plan.name, value: "" + choice.plan.id } as ChipData;
                }),
        ),
    );

    private readonly chipChange$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    productAudienceForm: FormGroup;
    productValueChipSelect = new FormControl("", { validators: Validators.required, updateOn: "submit" });
    isValid$: Observable<boolean> = this.productValueChipSelect.statusChanges.pipe(
        map((status) => status === "VALID"),
        distinctUntilChanged(),
        startWith(this.productValueChipSelect.valid),
        shareReplay(1),
    );
    productAudienceInputMissing = false;
    constructor(private readonly fb: FormBuilder, private readonly store: Store) {
        super();
    }

    ngOnInit(): void {
        this.productAudienceForm = this.fb.group({});
    }
    setInitializerData(initData: any): void {
        this.contextSubject$.next(initData);
    }

    setValue(values: EnrolledPlanAudience[]): void {
        this.chipSelect.setSelectedChips(values.map((value) => "" + value.enrolledPlanId));
    }

    getMappedControlValueChanges(): Observable<EnrolledPlanAudience[]> {
        return this.chipChange$.asObservable().pipe(
            withLatestFrom(this.contextSubject$.asObservable()),
            map(([selections, context]) =>
                selections
                    .filter((selection) => selection != null && selection.value != null && selection.value !== "")
                    .map(
                        (selection) =>
                            ({
                                type: "ENROLLMENT_PLAN",
                                enrolledPlanId: Number(selection.value),
                                enrolledProductId: context,
                            } as EnrolledPlanAudience),
                    ),
            ),
        );
    }

    monitorChipChange(selections: ChipData[]): void {
        this.chipChange$.next(selections);
        this.validate();
    }

    ngAfterViewInit(): void {
        this.productAudienceForm.addControl("productAudience", this.productValueChipSelect);
    }
    validate(): void {
        this.productValueChipSelect.updateValueAndValidity();
    }
    isValid(): Observable<boolean> {
        return this.isValid$;
    }
}
