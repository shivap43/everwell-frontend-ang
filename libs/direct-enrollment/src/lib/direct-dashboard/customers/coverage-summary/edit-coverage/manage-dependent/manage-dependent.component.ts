import { Component, OnInit, Input, ChangeDetectorRef, AfterViewChecked, Output, EventEmitter, OnDestroy } from "@angular/core";
import { MemberService } from "@empowered/api";
import { MatTableDataSource } from "@angular/material/table";
import { NgxMaskPipe } from "ngx-mask";
import { AppSettings, EnrollmentDependent, MemberProfile, MemberDependent } from "@empowered/constants";
import { FormBuilder, Validators, FormGroup, FormArray, FormControl } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { PreviousCoveredDependentsComponent } from "../previous-covered-dependents/previous-covered-dependents.component";
import { LanguageService } from "@empowered/language";
import { Subscription } from "rxjs";

@Component({
    selector: "empowered-manage-dependent",
    templateUrl: "./manage-dependent.component.html",
    styleUrls: ["./manage-dependent.component.scss"],
})
export class ManageDependentComponent implements OnInit, AfterViewChecked, OnDestroy {
    @Input() mpGroupId: number;
    @Input() enrolledData: EnrollmentDependent[];
    @Input() expireAfter: string;
    @Input() dependentHintMsg: string;
    @Input() memberInfo: MemberProfile;
    dependentData: EnrollmentDependent[] = [];
    memberDependents: MemberDependent[];
    previouslyEnrolledDep: EnrollmentDependent[] = [];
    displayedColumns = ["dependentId", "startDate", "endDate", "manage"];
    dataSource = new MatTableDataSource<any>();
    isDependentAvailable = false;
    dependentForm: FormGroup;
    toolTipText = "";
    formControlAdded: boolean;
    data: any[];
    totalDependent = 0;
    isActive = true;
    currentDate = new Date();
    showSpinner = true;
    previouslyCoveredDependentDialogRef: MatDialogRef<PreviousCoveredDependentsComponent>;
    isShowHintMsg = false;
    subscriptions: Subscription[] = [];
    @Output() emitFormChangeEvent: EventEmitter<boolean> = new EventEmitter();
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.editCoverage.noDependants",
        "primary.portal.editCoverage.noDependantsFoundInSystem",
        "primary.portal.editCoverage.noAdditonalDepandantsFound",
        "primary.portal.editCoverage.name",
        "primary.portal.editCoverage.select",
        "primary.portal.editCoverage.addDependent",
        "primary.portal.editCoverage.startDatelowercase",
        "primary.portal.editCoverage.endDatelowercase",
        "primary.portal.editCoverage.manage",
        "primary.portal.editCoverage.remove",
        "primary.portal.editCoverage.viewpreviouslyDependent",
        "primary.portal.common.selectionRequired",
        "primary.portal.editCoverage.coveredDependents",
    ]);
    dependentMsg = this.languageStrings["primary.portal.editCoverage.noDependants"];
    isDependentAdded = false;

    constructor(
        private readonly memberService: MemberService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly formBuilder: FormBuilder,
        private readonly datepipe: DatePipe,
        private readonly cd: ChangeDetectorRef,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        if (this.enrolledData && this.enrolledData.length > 0) {
            this.checkPreviouslyEnrolledDependents(this.enrolledData);
        }

        if (this.dependentData && this.dependentData.length > 0) {
            this.dependentMsg = "";
            this.dependentData = this.setDatasource(this.dependentData);
            if (this.dependentData.length > 0) {
                this.populateForm(this.dependentData);
            }
            this.dataSource.data = this.dependentsFormArray.value;
        }
        this.subscriptions.push(
            this.memberService.getMemberDependents(this.memberInfo.id, false, this.mpGroupId).subscribe(
                (dependents) => {
                    this.memberDependents = dependents;
                    if (this.memberDependents && this.memberDependents.length <= 0) {
                        this.isActive = false;
                        this.toolTipText = this.languageStrings["primary.portal.editCoverage.noDependantsFoundInSystem"];
                    } else if (this.memberDependents.length === this.enrolledData.length) {
                        this.checkAllDependentAdded();
                    } else {
                        this.isDependentAvailable = true;
                    }
                    this.showSpinner = false;
                },
                (error) => {
                    this.isActive = false;
                    this.showSpinner = false;
                },
            ),
        );

        if (this.dependentHintMsg !== "") {
            this.isShowHintMsg = true;
        }
    }

    populateForm(result: any): void {
        result.forEach((dep) => {
            this.addFormGroup(dep);
        });
    }

    addFormGroup(fdException: any): void {
        this.dependentsFormArray.push(this.setOfferingFormArray(fdException));
    }

    setOfferingFormArray(fdException: any): FormGroup {
        return this.formBuilder.group({
            dependentId: [{ value: fdException.dependentId, disabled: true }],
            startDate: [{ value: fdException.validity.effectiveStarting, disabled: true }],
            endDate: [{ value: fdException.validity.expiresAfter, disabled: true }],
            operation: [fdException.dependentId],
        });
    }

    addDependent(): void {
        this.isActive = false;
        this.dependentMsg = "";
        this.totalDependent = this.dependentsFormArray.length + this.previouslyEnrolledDep.length;
        if (this.memberDependents.length >= this.totalDependent) {
            this.dependentsFormArray.push(this.setDependentFormArray());
            this.dataSource.data = this.dependentsFormArray.value;
            this.totalDependent = this.totalDependent + 1;
            if (this.memberDependents.length === this.totalDependent) {
                this.checkAllDependentAdded();
            }
        }
    }

    initializeForm(): void {
        this.dependentForm = this.formBuilder.group({
            dependents: this.formBuilder.array([]),
        });
    }

    setDependentForm(): void {
        const userCtrl = this.dependentsFormArray;
        userCtrl.push(this.setDependentFormArray());
    }

    setDependentFormArray(): FormGroup {
        return this.formBuilder.group({
            dependentId: [
                "",
                {
                    validators: Validators.compose([Validators.required]),
                    updateOn: "blur",
                },
            ],
            startDate: [
                {
                    value: "",
                    disabled: true,
                },
            ],
            endDate: [
                {
                    value: "",
                    disabled: true,
                },
            ],
            operation: [null],
        });
    }

    get dependentsFormArray(): FormArray {
        return this.dependentForm.get("dependents") as FormArray;
    }

    setDatasource(data: any): any {
        data.forEach((dependent) => {
            dependent["isExisting"] = true;
        });
        return data;
    }

    removeDependent(index: number): void {
        if (this.dependentsFormArray.length > -1) {
            this.dependentsFormArray.removeAt(index);
            this.dataSource.data = this.dependentsFormArray.value;
            this.isActive = true;
            this.isDependentAvailable = true;
            if (this.dependentData.length === this.dependentsFormArray.length) {
                this.isDependentAdded = false;
                this.emitFormChangeEvent.emit(this.isDependentAdded);
            }
            if (this.dependentData.length === 0 && this.dependentsFormArray.length === 0) {
                this.dependentMsg = this.languageStrings["primary.portal.editCoverage.noDependants"];
            }
        }
    }

    dependentsArrayControl(index: number, control: string): FormControl {
        return this.dependentsFormArray.at(index).get(control) as FormControl;
    }

    changeDatePickers(event: any, idx: number): void {
        if (this.memberDependents.length === this.totalDependent) {
            this.checkAllDependentAdded();
        } else {
            this.isActive = true;
        }
        if (event.value !== "") {
            this.isDependentAdded = true;
            this.dependentsArrayControl(idx, "startDate").enable();
            this.dependentsArrayControl(idx, "startDate").patchValue(this.currentDate);
            this.dependentsArrayControl(idx, "endDate").enable();
            this.dependentsArrayControl(idx, "endDate").patchValue(this.expireAfter);
        } else {
            this.isDependentAdded = false;
            this.dependentsArrayControl(idx, "startDate").disable();
            this.dependentsArrayControl(idx, "startDate").patchValue("");
            this.dependentsArrayControl(idx, "endDate").disable();
            this.dependentsArrayControl(idx, "endDate").patchValue("");
        }
        this.createListners();
    }

    getDependentStatus(index: number): boolean {
        let depStatus = false;
        if (this.enrolledData && this.enrolledData.length > 0) {
            const idx = this.enrolledData.findIndex((x) => x.dependentId === index);
            if (idx > -1) {
                depStatus = true;
            }
        }
        if (!depStatus && this.dependentsFormArray.length > -1) {
            this.dependentsFormArray.value.forEach((element) => {
                if (element.dependentId === index) {
                    depStatus = true;
                    return;
                }
            });
        }
        return depStatus;
    }

    ngAfterViewChecked(): void {
        this.cd.detectChanges();
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    openPreviouslyCoveredDependent(): void {
        this.previouslyCoveredDependentDialogRef = this.dialog.open(PreviousCoveredDependentsComponent, {
            minWidth: "600px",
            maxHeight: "600px",
            data: this.previouslyEnrolledDep,
        });
    }

    checkPreviouslyEnrolledDependents(data: any): void {
        for (const [i, element] of data.entries()) {
            if (
                element.validity.expiresAfter &&
                element.validity.expiresAfter < this.datepipe.transform(this.currentDate, AppSettings.DATE_FORMAT)
            ) {
                this.previouslyEnrolledDep.push(element);
            } else {
                this.dependentData.push(element);
            }
        }
    }

    createListners(): void {
        this.subscriptions.push(
            this.dependentForm.valueChanges.subscribe((res) => {
                this.emitFormChangeEvent.emit(this.isDependentAdded);
            }),
        );
    }

    checkAllDependentAdded(): void {
        this.isActive = false;
        this.toolTipText = this.languageStrings["primary.portal.editCoverage.noAdditonalDepandantsFound"];
        this.isDependentAvailable = false;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
