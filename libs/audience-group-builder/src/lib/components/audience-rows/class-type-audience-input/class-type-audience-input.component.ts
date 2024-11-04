import { Store } from "@ngxs/store";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Component, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { AudienceInput } from "../AudienceInput";
import { ClassAudience, ClassNames } from "@empowered/api";
import { Observable, BehaviorSubject } from "rxjs";
import { AudienceGroupBuilderState, ClassTypeName, GetClassName } from "@empowered/ngxs-store";
import { withLatestFrom, distinctUntilChanged, startWith, shareReplay, map } from "rxjs/operators";
import { ChipData } from "@empowered/constants";
import { ChipSelectComponent } from "@empowered/ui";

@Component({
    selector: "empowered-class-type-audience-input",
    templateUrl: "./class-type-audience-input.component.html",
    styleUrls: ["./class-type-audience-input.component.scss"],
})
export class ClassTypeAudienceInputComponent extends AudienceInput<ClassAudience> implements OnInit, AfterViewInit {
    @ViewChild(ChipSelectComponent, { static: true }) chipSelect: ChipSelectComponent;

    /**
     * DATA OBSERVABLES
     */
    private readonly contextSubject$: BehaviorSubject<number> = new BehaviorSubject(null);
    private readonly classTypeAudienceMissing$: BehaviorSubject<boolean> = new BehaviorSubject(null);
    allClassNameChips$: Observable<ChipData[]> = this.store.select(AudienceGroupBuilderState.getClassNames).pipe(
        withLatestFrom(this.contextSubject$.asObservable()),
        map(([classTypeNames, contextId]) => {
            const classTypeName: ClassTypeName = classTypeNames.find((ctn) => ctn.classTypeId === contextId);
            return classTypeName != null ? classTypeName.classNames : [];
        }),
        map((classNames) => classNames.map((className) => this.classNameToChip(className))),
    );

    private readonly chipChange$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    classTypeAudienceForm: FormGroup;
    classTypeValueChipSelect = new FormControl("", { validators: Validators.required, updateOn: "submit" });
    isValid$: Observable<boolean> = this.classTypeValueChipSelect.statusChanges.pipe(
        map((status) => status === "VALID"),
        distinctUntilChanged(),
        startWith(this.classTypeValueChipSelect.valid),
        shareReplay(1),
    );

    constructor(private readonly fb: FormBuilder, private readonly store: Store) {
        super();
    }

    ngOnInit(): void {
        this.classTypeAudienceForm = this.fb.group({});
    }

    setInitializerData(initData: any): void {
        this.store.dispatch(new GetClassName(initData));
        this.contextSubject$.next(initData);
    }

    setValue(values: ClassAudience[]): void {
        this.chipSelect.setSelectedChips(values.map((value) => value.classId.toString()));
    }

    getMappedControlValueChanges(): Observable<ClassAudience[]> {
        return this.chipChange$.asObservable().pipe(
            withLatestFrom(this.contextSubject$.asObservable()),
            map(([chipSelections, contextClassType]) =>
                chipSelections
                    .filter((selection) => selection != null && selection.value != null && selection.value !== "")
                    .map(
                        (selection) =>
                            ({
                                type: "CLAZZ",
                                classId: Number(selection.value),
                                classTypeId: contextClassType,
                            } as ClassAudience),
                    ),
            ),
        );
    }

    monitorChipChange(selections: ChipData[]): void {
        this.chipChange$.next(selections);
        this.validate();
    }

    private classNameToChip(className: ClassNames): ChipData {
        return { name: className.name, value: className.id.toString() } as ChipData;
    }
    ngAfterViewInit(): void {
        this.classTypeAudienceForm.addControl("classTypeAudience", this.classTypeValueChipSelect);
    }
    validate(): void {
        this.classTypeValueChipSelect.updateValueAndValidity();
    }
    isValid(): Observable<boolean> {
        return this.isValid$;
    }
}
