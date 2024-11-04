import { Validators, FormControl } from "@angular/forms";
import { FormGroup } from "@angular/forms";
import { FormBuilder } from "@angular/forms";
import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from "@angular/core";
import { AudienceInput } from "../AudienceInput";
import { MemberSpecificAudience, MemberService, MemberIdentifierTypeIDs } from "@empowered/api";
import { Observable, BehaviorSubject, forkJoin, Subscription } from "rxjs";
import { filter, take, tap, distinctUntilChanged, startWith, shareReplay, map } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { ChipSelectComponent } from "@empowered/ui";
import { AudienceGroupBuilderState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { ChipData } from "@empowered/constants";

@Component({
    selector: "empowered-employee-id-audience-input",
    templateUrl: "./employee-id-audience-input.component.html",
    styleUrls: ["./employee-id-audience-input.component.scss"],
})
export class EmployeeIdAudienceInputComponent extends AudienceInput<MemberSpecificAudience> implements OnInit, AfterViewInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.audienceBuilder.employeeIdInputLabel",
    ]);

    @ViewChild(ChipSelectComponent, { static: true }) chipSelect: ChipSelectComponent;

    /**
     * DATA OBSERVABLES
     */
    allEmployeeIdsChips$: Observable<ChipData[]> = this.store.select(AudienceGroupBuilderState.getEmployeeIds).pipe(
        filter((searchMembers) => searchMembers && searchMembers != null),
        map((searchMembers) =>
            searchMembers.content.reduce((content, memberListItem) => {
                const member = {
                    value: memberListItem.employeeId,
                    name: `${memberListItem.employeeId} - ${memberListItem.firstName} ${memberListItem.lastName}`,
                };
                return memberListItem.employeeId ? content.concat(member) : content;
            }, []),
        ),
    );

    private readonly chipChange$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    employeeStatusSelectionForm: FormGroup;
    employeeStatusSelection = new FormControl("", { validators: Validators.required, updateOn: "submit" });
    isValid$: Observable<boolean> = this.employeeStatusSelection.statusChanges.pipe(
        map((status) => status === "VALID"),
        distinctUntilChanged(),
        startWith(this.employeeStatusSelection.valid),
        shareReplay(1),
    );
    employeeStatusChecked = false;
    subscriptions: Subscription[] = [];

    constructor(
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.employeeStatusSelectionForm = this.fb.group({});
    }
    // Initializer not used
    setInitializerData(): void {}

    /**
     * Function to set value for member specific audience
     * @param values member specific audience values {MemberSpecificAudience[]}
     */
    setValue(values: MemberSpecificAudience[]): void {
        this.subscriptions.push(
            forkJoin(
                values
                    .reduce((accumulator, currentValue) => accumulator.concat(currentValue.memberIds), [])
                    .reduce(
                        (accumulator, currentValue) =>
                            accumulator.indexOf(currentValue) !== -1 ? accumulator : [...accumulator, currentValue],
                        [],
                    )
                    .map((memberId: number) =>
                        this.memberService.getMemberIdentifiers(memberId, MemberIdentifierTypeIDs.TYPE).pipe(
                            take(1),
                            map<any, string>((identifiers) => identifiers.value["EMPLOYEE_ID"]),
                        ),
                    ),
            )
                .pipe(tap((employeeIds: string[]) => this.chipSelect.setSelectedChips(employeeIds)))
                .subscribe(),
        );
    }

    getMappedControlValueChanges(): Observable<MemberSpecificAudience[]> {
        return this.chipChange$.asObservable().pipe(
            map((chipSelections) => [
                {
                    type: "EMPLOYEE_ID",
                    identifiers: chipSelections.map((chipSelection) => chipSelection.value),
                } as MemberSpecificAudience,
            ]),
        );
    }

    monitorChipChange(selections: ChipData[]): void {
        this.chipChange$.next(selections);
        this.validate();
    }

    ngAfterViewInit(): void {
        this.employeeStatusSelectionForm.addControl("employeeStatus", this.employeeStatusSelection);
    }
    validate(): void {
        this.employeeStatusSelection.updateValueAndValidity();
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
