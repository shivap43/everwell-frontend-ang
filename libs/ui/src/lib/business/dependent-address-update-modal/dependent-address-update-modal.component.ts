import { Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { DependentContact, MemberService } from "@empowered/api";
import { ClientErrorResponseCode, DependentAddressUpdateModalLanguage, MemberDependent, PersonalAddress } from "@empowered/constants";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { AccountListState } from "@empowered/ngxs-store";
import { Select } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";

interface DialogData {
    memberId: number;
    memberAddress: PersonalAddress;
    mpGroupId: number;
}

const ERROR = "error";
const DETAILS = "details";
const COMMA_SEPARATOR = ", ";
const SPACE_SEPARATOR = " ";

@Component({
    selector: "empowered-dependent-address-update-modal",
    templateUrl: "./dependent-address-update-modal.component.html",
    styleUrls: ["./dependent-address-update-modal.component.scss"],
})
export class DependentAddressUpdateModalComponent implements OnInit, OnDestroy {
    readonly languageStrings: Record<string, string>;

    isLoading: boolean;
    showSpinner: boolean;
    addressUpdateModalForm: FormGroup;
    apiError: string;
    mpGroup: number;
    dependentList: MemberDependent[] = [];
    selectedDependentIds: string[] = [];
    memberAddress = "";

    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @Select(AccountListState.getMpGroupId) mpGroup$: Observable<number>;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<DependentAddressUpdateModalComponent>,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly memberService: MemberService,
        private readonly replaceTagPipe: ReplaceTagPipe,
    ) {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues([
            DependentAddressUpdateModalLanguage.CLOSE,
            DependentAddressUpdateModalLanguage.BUTTON_SKIP,
            DependentAddressUpdateModalLanguage.BUTTON_UPDATE,
            DependentAddressUpdateModalLanguage.HEADER,
            DependentAddressUpdateModalLanguage.CONTENT,
            DependentAddressUpdateModalLanguage.SELECTION_REQUIRED,
        ]);
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.addressUpdateModalForm = this.fb.group({ dependents: [""] });
        this.mpGroup$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.mpGroup = this.data.mpGroupId ?? x));
        this.getMemberDependents(this.data.memberId, this.mpGroup);
    }

    /**
     * Method used to update the dependent address
     */
    updateDependantAddress(): void {
        if (!this.selectedDependentIds.length) {
            this.addressUpdateModalForm.controls.dependents.setErrors({ required: true });
        }

        if (!(this.addressUpdateModalForm.valid && this.selectedDependentIds.length)) {
            return;
        }

        const dependentAddress: DependentContact = {
            address: this.data.memberAddress,
        };

        this.selectedDependentIds.forEach((dependent, index) => {
            this.isLoading = true;
            this.memberService
                .saveDependentContact(dependentAddress, this.data.memberId, dependent.toString(), this.mpGroup)
                .pipe(take(1))
                .subscribe(
                    () => {
                        if (index === this.selectedDependentIds.length - 1) {
                            this.isLoading = false;
                            this.matDialogRef.close();
                        }
                    },
                    () => {
                        this.apiError = this.languageService.fetchSecondaryLanguageValue("secondary.portal.updateDependent.api.error");
                        this.isLoading = false;
                    },
                );
        });
    }

    /**
    Update selected dependent list based on check box value
    * @param event check box event
    * @returns void
    */
    checkDependentSelection(event: MatCheckboxChange): void {
        const selectedDependent = event.source.value;

        if (event.checked) {
            this.selectedDependentIds.push(selectedDependent);
        } else {
            this.selectedDependentIds = this.selectedDependentIds.filter((dependent) => dependent !== selectedDependent);
        }
    }

    /**
     * Gets member dependents and initializes relevant variables
     * @param memberId member's ID
     * @param groupId member's group ID
     * @returns void
     */
    getMemberDependents(memberId: number, groupId: number): void {
        this.memberService
            .getMemberDependents(memberId, false, groupId)
            .pipe(take(1))
            .subscribe(
                (dependents: MemberDependent[]) => {
                    if (dependents?.length > 0) {
                        this.dependentList = dependents;
                        this.buildMemberAddress(this.data.memberAddress);
                    }

                    this.isLoading = false;
                },
                () => {
                    this.apiError = this.replaceTagPipe.transform(DependentAddressUpdateModalLanguage.DEPENDENT_FETCH_ERROR, {
                        "##mpgroup##": this.mpGroup.toString(),
                        "##memberid##": memberId.toString(),
                    });
                    this.isLoading = false;
                },
            );
    }

    /**
     * Function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        if (error?.status === ClientErrorResponseCode.RESP_400 && error[DETAILS]?.length > 0) {
            this.apiError = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[DETAILS][0].field}`,
            );
        } else {
            this.apiError = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Function to build the member address in required format - AddressLine 1, Address Line 2 (if any), City, ST(space) ZIP
     * @returns void
     */
    buildMemberAddress(address: PersonalAddress): void {
        this.memberAddress = this.memberAddress.concat(
            address?.address1,
            COMMA_SEPARATOR,
            address?.address2 ? address?.address2 + COMMA_SEPARATOR : SPACE_SEPARATOR.trim(),
            address?.city ? address?.city + COMMA_SEPARATOR : SPACE_SEPARATOR.trim(),
            address?.state,
            SPACE_SEPARATOR,
            address?.zip,
        );
    }

    /**
     * Method used to close the modal
     */
    closePopup(): void {
        this.matDialogRef.close();
    }

    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
