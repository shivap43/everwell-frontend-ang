import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { BenefitsOfferingService, BenefitOfferingSettingsInfo } from "@empowered/api";
import { CountryState } from "@empowered/constants";
import { AbstractControl, FormBuilder, FormGroup } from "@angular/forms";
import { ChipData } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Subject, Observable, BehaviorSubject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { UpdateBenefitsOfferingState } from "@empowered/ngxs-store";
import { MonDialogComponent } from "@empowered/ui";

@Component({
    selector: "empowered-edit-states-pop-up",
    templateUrl: "./edit-states-pop-up.component.html",
    styleUrls: ["./edit-states-pop-up.component.scss"],
})
export class EditStatesPopUpComponent implements OnInit, OnDestroy {
    enableCensusField = false;
    censusStates = "";
    form: FormGroup;
    radioValue = "1";
    notLicensedStates: string[] = [];
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    filteredState$: Observable<CountryState[]>;
    selectedStates: string[];

    readonly UPDATE_ON_CHANGE = "change";

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    private readonly allStatesSubject$: BehaviorSubject<ChipData[]> = new BehaviorSubject([]);
    allStates$: Observable<ChipData[]> = this.allStatesSubject$.asObservable();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.editStates",
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.statesServicing",
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.statesServicingDesc",
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.selectStates",
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.useStates",
        "primary.portal.maintenanceBenefitsOffering.editStatesPopup.includeStates",
        "primary.portal.common.close",
        "primary.portal.common.save",
        "primary.portal.common.cancel",
    ]);
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<EditStatesPopUpComponent>,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly matDialog: MatDialog,
        private readonly language: LanguageService,
        private readonly store: Store,
    ) {}

    stateControlRequiredValidator = (control: AbstractControl): { atLeastOneStateRequired: boolean } | null =>
        (!(control.value && control.value.length) && {
            atLeastOneStateRequired: true,
        }) ||
        null;

    /**
     * Initializes form and other necessary variables
     */
    ngOnInit(): void {
        if (this.data.recentcensusData) {
            this.enableCensusField = true;
            this.censusStates = this.data.staticStates
                .filter((state) => this.data.recentcensusData.states.includes(state.abbreviation))
                .map((state) => state.name)
                .join(", ");
        }

        const allStates = this.data.staticStates
            .map((state) => ({
                name: state.name,
                value: state.abbreviation,
                required: state.name === this.data.groupSitusState,
            }))
            // list required options first followed by the rest
            .reduce((acc, curr) => (curr.required ? [curr, ...acc] : [...acc, curr]), []);

        this.allStatesSubject$.next(allStates);
        this.selectedStates = allStates
            .map((state) => state.value)
            .filter((state) => this.data.states.some((selectedState) => selectedState.abbreviation === state));

        this.form = this.formBuilder.group({
            stateControl: [this.selectedStates, [this.stateControlRequiredValidator]],
        });
    }

    radioChange(event: any): void {
        this.radioValue = event.value;
    }

    /**
     * Submits form if it is valid
     */
    submitForm(): void {
        this.notLicensedStates = this.data.states
            .map((data) => data.name)
            .filter((states) => !this.data.licensedStates.map((state) => state.name).includes(states));
        if (this.form.valid) {
            if (this.notLicensedStates.length) {
                this.alertDialog();
            } else {
                this.saveStates();
            }
        }
    }

    alertDialog(): void {
        let stateInfo = "";
        let stateCount = "";
        this.notLicensedStates.forEach((state) => {
            if (stateInfo === "") {
                stateInfo = state;
            } else {
                stateInfo = stateInfo + "/" + state;
            }
        });
        if (this.notLicensedStates.length < 2) {
            stateCount = this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.oneState");
        } else if (this.notLicensedStates.length > 1) {
            stateCount = this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.manyState");
        }
        this.alertDialogRef = this.matDialog.open(MonDialogComponent, {
            hasBackdrop: true,
            width: "700px",
            data: {
                title: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.title"),
                content:
                    this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.startSubTitle") +
                    stateInfo +
                    this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.middleSubtitle") +
                    this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.endSubtitle") +
                    stateCount,
                secondaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
                    buttonAction: this.alert.bind(this, true),
                    buttonClass: "mon-btn-link",
                },
                primaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.setting.licensedModal.gotIt"),
                    buttonClass: "mon-btn-primary",
                    buttonAction: this.alert.bind(this, false),
                },
            },
        });
    }

    alert(buttonResponse: boolean): void {
        if (buttonResponse) {
            this.alertDialogRef.close();
        } else {
            this.saveStates();
        }
    }

    /**
     * Saves selected serviced states
     */
    saveStates(): void {
        if (!this.radioValue) {
            this.radioValue = "1";
        }
        if (this.radioValue === "1") {
            this.saveBenefitStates(
                this.form.controls.stateControl.value.map((state) => ({
                    name: state.name,
                    abbreviation: state.value,
                })),
            );
        } else if (this.radioValue === "2") {
            this.saveBenefitStates(
                this.data.staticStates.filter((state) => this.data.recentcensusData.states.includes(state.abbreviation)),
            );
        }
    }

    /**
     * save the benefit offering states info
     * @param states selected states details
     */
    saveBenefitStates(states: any[]): void {
        const updatedStatesInfo: BenefitOfferingSettingsInfo = {
            stateAbbreviations: states.map((state) => state.abbreviation),
        };
        this.benefitsService
            .saveBenefitOfferingSettings(updatedStatesInfo, this.data.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.store.dispatch(new UpdateBenefitsOfferingState(states));
                if (this.alertDialogRef) {
                    this.alertDialogRef.close();
                }
                this.dialogRef.close("save");
            });
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
