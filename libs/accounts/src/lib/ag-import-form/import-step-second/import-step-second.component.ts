import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { AflacService, SearchProducer } from "@empowered/api";
import { FormGroup } from "@angular/forms";
import { Observable, Subject, of } from "rxjs";
import { map, startWith, takeUntil, tap, filter, switchMap, finalize } from "rxjs/operators";
import { STEP_SECOND } from "../ag-import-form.constant";
import { AflacBusinessService } from "@empowered/api-service";
import { MatRadioChange } from "@angular/material/radio";
import { ConfigName, CompanyCode, SITCode, WritingNumber, Accounts } from "@empowered/constants";
const PRODUCER_OPTION_ME = "me";
interface OPTION {
    name: string;
    email: string;
    wn: WritingNumber[] | string[];
}
@Component({
    selector: "empowered-import-step-second",
    templateUrl: "./import-step-second.component.html",
    styleUrls: ["./import-step-second.component.scss"],
})
export class ImportStepSecondComponent implements OnInit, OnDestroy {
    // list of producers
    @Input() producerSearchList: SearchProducer[];
    // collection of locales.
    @Input() languageStrings: Record<string, string>;
    // company code. Either US or NY
    @Input() companyCode: CompanyCode;
    // Form group for this step
    @Input() stepControl: FormGroup;
    // Aflac account
    @Input() aflacAccount: Accounts;
    // Aflac group Number
    @Input() aflacGroupNo: Accounts;
    // true -> show spinner. false -> hide spinner
    showSpinner = false;
    // flag to check availability of subordinates
    isSubordinatesAvailable = false;
    // collection of sit codes.
    sitCodes: SITCode[];
    // collection of wn numbers
    writingNumbers: WritingNumber[];
    // collection of options for autocomplete.
    options: OPTION[] = [];
    // collection of updated options [updates on change of input].
    filteredOptions: Observable<OPTION[]>;
    sitCodeConfig = ConfigName.ENABLE_SIT_CODE_HIERARCHY;
    // This property used to clear subscription.
    private readonly unsubscribe$: Subject<void> = new Subject();
    /**
     * constructor of class.
     * @param aflac - aflac service injection.
     */
    constructor(private readonly aflac: AflacService, private readonly aflacBusinessService: AflacBusinessService) {}
    /**
     * Life cycle hook of angular.
     */
    ngOnInit(): void {
        if (this.producerSearchList && this.producerSearchList.length > 0) {
            this.isSubordinatesAvailable = true;
        }
        this.onSelectOfProducer();
        this.getWritingNumbers();
        this.getFilterOptions();
    }

    /**
     * listen changes of radio group [producer].
     * update wn no and sit code accordingly.
     */
    onSelectOfProducer(): void {
        this.stepControl
            .get(STEP_SECOND.producer)
            .valueChanges.pipe(takeUntil(this.unsubscribe$))
            .subscribe((producer) => {
                this.stepControl.get(STEP_SECOND.writingNumber).reset();
                this.stepControl.get(STEP_SECOND.sitCode).reset();
                if (producer === STEP_SECOND.me) {
                    this.getWritingNumbers();
                } else {
                    this.writingNumbers = [];
                    this.sitCodes = [];
                }
            });
    }
    /**
     * On select of selected sub producer.
     * Get WN no for selected sub producer
     * @writingNos writing no.
     */
    selectedSubProducer(writingNos: WritingNumber[]): void {
        this.sitCodes = [];
        this.stepControl.controls.sitCode.setValue("");
        this.writingNumbers = writingNos.filter((wn) => wn.sitCodes.some((code) => code.companyCode === this.companyCode));
        if (this.writingNumbers.length === 1) {
            this.stepControl.get(STEP_SECOND.writingNumber).patchValue(this.writingNumbers[0]);
            this.onSelectOfWritingNo(this.writingNumbers[0]).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }
    /**
     * This method will update SIT codes.
     * @param wn writing numbers
     * @returns string message in tooltip as observable
     */
    onSelectOfWritingNo(wn: WritingNumber): Observable<string> {
        this.stepControl.controls.sitCode.setValue("");
        this.sitCodes = wn.sitCodes.filter((sitCode) => sitCode.companyCode === this.companyCode);
        if (this.sitCodes.length === 1) {
            this.stepControl.get(STEP_SECOND.sitCode).patchValue(this.sitCodes[0].id);
            return this.getSitCodeHierarchy();
        }
        return of("");
    }
    /**
     * Set the sit codes and sit code hierarchy
     * @param wn writing numbers
     */
    onWritingNumberChange(wn: WritingNumber): void {
        this.onSelectOfWritingNo(wn).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }
    /**
     * Set the sit code hierarchy
     * @param sitCode selected sitCode
     */
    onSitCodeChange(sitCode: number): void {
        this.getSitCodeHierarchy(sitCode).pipe(takeUntil(this.unsubscribe$)).subscribe();
    }
    /**
     * To get SIT code hierarchy of the writing number and SIT code combination
     * @param sitCodeId selected sitCode id
     * @returns observable to type string which is the sit code hierarchy
     */
    getSitCodeHierarchy(sitCodeId?: number): Observable<string> {
        const sitCode = sitCodeId ? sitCodeId : this.sitCodes[0].id;
        return this.aflacBusinessService.getSitCodeHierarchy(sitCode).pipe(
            tap((sitCodeHierarchy) => {
                this.stepControl.get("sitCodeHierarchy").setValue(sitCodeHierarchy);
                this.showSpinner = false;
            }),
        );
    }
    /**
     * To get Writing-Numbers as well as SIT Code.
     */
    getWritingNumbers(): void {
        this.showSpinner = true;
        this.aflac
            .getSitCodes(this.companyCode)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((response: WritingNumber[]) => {
                    this.writingNumbers = response;
                    this.sitCodes = response.map((writingNo) => writingNo.sitCodes).reduce((acc, currentEle) => acc.concat(currentEle));
                }),
                filter(() => this.writingNumbers.length === 1),
                switchMap(() => {
                    this.stepControl.get(STEP_SECOND.writingNumber).patchValue(this.writingNumbers[0]);
                    return this.onSelectOfWritingNo(this.writingNumbers[0]);
                }),
                finalize(() => {
                    this.showSpinner = false;
                }),
            )
            .subscribe();
    }
    /**
     * Filters the list based on user input
     */
    getFilterOptions(): void {
        this.options = this.producerSearchList.map((member) => ({
            name: `${member.name.firstName} ${member.name.lastName}`,
            email: member.email,
            wn: member.writingNumbers,
        }));

        this.filteredOptions = this.stepControl.get(STEP_SECOND.teamMember).valueChanges.pipe(
            startWith(""),
            map((value) => this.filter(value)),
        );
    }
    /**
     * Display value for teamMember.
     */
    showTeamMember(value: { name: string }): { name: string } | string {
        return value.name ? value.name : value;
    }
    /**
     * filter the list based on user input.
     * @param searchValue input of user.
     * @returns OPTION type array
     */
    private filter(searchValue: { name: string } | string): OPTION[] {
        let filterValue: string;
        if (searchValue && typeof searchValue === STEP_SECOND.object) {
            filterValue = ((searchValue as { name: string }).name || "").toLowerCase();
        } else {
            filterValue = (searchValue || "").toString().toLowerCase();
        }
        if (filterValue.length < STEP_SECOND.THREE) {
            return [];
        }

        const filteredResult = this.options.filter((option) => option.name.toLowerCase().includes(filterValue));
        if (filteredResult.length === 0) {
            this.stepControl.get(STEP_SECOND.teamMember).setErrors({ noProducer: true });
        }
        return filteredResult;
    }
    /**
     * Set teams search as empty
     * @param event event of change in selection of radio button
     */
    onProducerChange(event: MatRadioChange): void {
        if (event.value === PRODUCER_OPTION_ME) {
            this.stepControl.get(STEP_SECOND.teamMember).setValue("");
        }
    }
    /**
     * Life cycle hook for angular.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
