import { takeUntil } from "rxjs/operators";
import { STEP_SECOND } from "../../ag-import-form/ag-import-form.constant";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { AflacService } from "@empowered/api";
import { CompanyCode, SITCode, WritingNumber } from "@empowered/constants";
import { FormGroup } from "@angular/forms";
import { Observable, Subject } from "rxjs";
import { DIGIT_ONE, DIGIT_ZERO } from "../self-enrollment-constant";
interface OPTION {
    name: string;
    email: string;
    wn: WritingNumber[] | string[];
}
@Component({
    selector: "empowered-self-enrollment-sit-code",
    templateUrl: "./self-enrollment-sit-code.component.html",
    styleUrls: ["./self-enrollment-sit-code.component.scss"],
})
export class SelfEnrollmentSitCodeComponent implements OnInit, OnDestroy {
    @Input() languageStrings: Record<string, string>;
    @Input() companyCode: CompanyCode;
    @Input() stepControl: FormGroup;
    showSpinner = false;
    sitCodes: SITCode[];
    writingNumbers: WritingNumber[];
    options: OPTION[] = [];
    filteredOptions: Observable<OPTION[]>;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(private readonly aflac: AflacService) {}
    /**
     * Life cycle hook of angular to initialize the component and fetch the writing number based on country code
     */
    ngOnInit(): void {
        this.getWritingNumbers();
    }

    /**
     * This method will update SIT codes.
     * @param wn writing numbers
     * @returns void
     */
    onSelectOfWritingNo(wn: WritingNumber): void {
        this.sitCodes = wn.sitCodes.filter((sitCode) => sitCode.companyCode === this.companyCode);
        if (this.sitCodes.length === DIGIT_ONE) {
            this.stepControl.get(STEP_SECOND.sitCode).patchValue(this.sitCodes[DIGIT_ZERO].id);
        }
    }
    /**
     * To get Writing-Numbers as well as SIT Code.
     * @returns void
     */
    getWritingNumbers(): void {
        this.showSpinner = true;
        this.aflac
            .getSitCodes(this.companyCode)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: WritingNumber[]) => {
                    if (response.length) {
                        this.writingNumbers = response;
                        this.sitCodes = this.writingNumbers
                            .map((writingNo) => writingNo.sitCodes)
                            .reduce((acc, currentEle) => acc.concat(currentEle));
                        if (this.writingNumbers.length === DIGIT_ONE) {
                            this.stepControl.get(STEP_SECOND.writingNumber).patchValue(this.writingNumbers[DIGIT_ZERO]);
                            this.onSelectOfWritingNo(this.writingNumbers[DIGIT_ZERO]);
                        }
                    }
                    this.showSpinner = false;
                },
                (err) => {
                    this.showSpinner = false;
                },
            );
    }

    /**
     * Life cycle hook for angular.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
