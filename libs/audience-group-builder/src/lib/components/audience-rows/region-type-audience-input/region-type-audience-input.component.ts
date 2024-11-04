import { Store } from "@ngxs/store";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { RegionAudience } from "@empowered/api";
import { AudienceInput } from "../AudienceInput";
import { BehaviorSubject, Observable } from "rxjs";
import { AudienceGroupBuilderState, RegionTypeRegion, GetRegion } from "@empowered/ngxs-store";
import { ChipData } from "@empowered/constants";
import { ChipSelectComponent } from "@empowered/ui";
import { map, withLatestFrom, distinctUntilChanged, startWith, shareReplay } from "rxjs/operators";
import { FormGroup, FormControl, FormBuilder, Validators } from "@angular/forms";

@Component({
    selector: "empowered-region-type-audience-input",
    templateUrl: "./region-type-audience-input.component.html",
    styleUrls: ["./region-type-audience-input.component.scss"],
})
export class RegionTypeAudienceInputComponent extends AudienceInput<RegionAudience> implements OnInit, AfterViewInit {
    @ViewChild(ChipSelectComponent, { static: true }) chipSelect: ChipSelectComponent;

    private readonly contextSubject$: BehaviorSubject<number> = new BehaviorSubject(null);
    allRegionChips$: Observable<ChipData[]> = this.store.select(AudienceGroupBuilderState.getRegions).pipe(
        withLatestFrom(this.contextSubject$.asObservable()),
        map(([regionTypes, contextRegionType]) => {
            const regionType: RegionTypeRegion = regionTypes.find((region) => region.regionTypeId === contextRegionType);
            return regionType != null ? regionType.regions : [];
        }),
        // eslint-disable-next-line arrow-body-style
        map((regions) => regions.map((region) => ({ name: region.name, value: "" + region.id } as ChipData))),
    );

    private readonly chipChange$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    regionTypeAudienceForm: FormGroup;
    regionTypeAudience: FormControl;
    regionTypeValueChipSelect = new FormControl("", { validators: Validators.required, updateOn: "submit" });
    isValid$: Observable<boolean> = this.regionTypeValueChipSelect.statusChanges.pipe(
        map((status) => status === "VALID"),
        distinctUntilChanged(),
        startWith(this.regionTypeValueChipSelect.valid),
        shareReplay(1),
    );
    regionTypeAudienceMissing = false;
    constructor(private readonly fb: FormBuilder, private readonly store: Store) {
        super();
    }

    ngOnInit(): void {
        this.regionTypeAudienceForm = this.fb.group({});
    }

    setInitializerData(initData: any): void {
        this.store.dispatch(new GetRegion(initData));
        this.contextSubject$.next(initData);
    }

    setValue(values: RegionAudience[]): void {
        this.chipSelect.setSelectedChips(values.map((value) => "" + value.regionId));
    }

    getMappedControlValueChanges(): Observable<RegionAudience[]> {
        return this.chipChange$.asObservable().pipe(
            withLatestFrom(this.contextSubject$.asObservable()),
            map(([selections, contextRegionTypeId]) =>
                selections
                    .filter((selection) => selection != null && selection.value != null && selection.value !== "")
                    // eslint-disable-next-line arrow-body-style
                    .map((selection) => {
                        return {
                            type: "REGION",
                            regionId: Number(selection.value),
                            regionTypeId: contextRegionTypeId,
                        } as RegionAudience;
                    }),
            ),
        );
    }

    monitorChipChange(selections: ChipData[]): void {
        this.chipChange$.next(selections);
        this.validate();
    }

    ngAfterViewInit(): void {
        this.regionTypeAudienceForm.addControl("regionTypeAudience", this.regionTypeValueChipSelect);
    }
    validate(): void {
        this.regionTypeValueChipSelect.updateValueAndValidity();
    }
    isValid(): Observable<boolean> {
        return this.isValid$;
    }
}
