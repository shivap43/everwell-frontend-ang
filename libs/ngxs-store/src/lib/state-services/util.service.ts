import { DomSanitizer } from "@angular/platform-browser";
import { Injectable, EventEmitter } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
import { Observable, BehaviorSubject, combineLatest, of } from "rxjs";
import { DatePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { AccountService, QLEEndPlanRequestStatus, StaticService } from "@empowered/api";
import { map, catchError } from "rxjs/operators";
import { loadAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.actions";
import { getSelectedAccount, getSelectedMPGroup } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
import {
    ConfigName,
    DateFormats,
    SuccessResponseCode,
    NotificationTypes,
    Accounts,
    MemberContact,
    MemberContactListDisplay,
    MemberQualifyingEvent,
    Account,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import { checkIfAbleToAccessModuleInHQAccount } from "./hq.guard";
import { StaticUtilService } from "./static-util.service";

const MINUTE_IN_MILLISECONDS = 60000;
const KEYPRESS = "keypress";
const PRETAX = "PRETAX";
const POST_TAX = "POSTTAX";
const DEFAULT_AGENT_LEVEL = "5";
const SUBSTRING_LENGTH = 1;
const VALUE_LIMIT = 2;
const EMAIL = "email";
const PHONE = "phoneNumber";
const HYPHEN = "-";
const STAR = "*";

export interface FormData {
    formType: string;
    formSubmitted: boolean;
}

@Injectable({
    providedIn: "root",
})
export class UtilService {
    private notificationSidenav: MatSidenav;
    private readonly invokeNotification$ = new BehaviorSubject<boolean>(false);
    private readonly formSubmit$ = new BehaviorSubject<FormData>({
        formType: "",
        formSubmitted: false,
    });
    currentForm = this.formSubmit$.asObservable();
    notificationCount: number;
    mpGroup: number;
    mpGroupUpdated: EventEmitter<any> = new EventEmitter();
    portalTabName: EventEmitter<any> = new EventEmitter();
    isNotificationTriggered: EventEmitter<any> = new EventEmitter();
    refreshActivity = false;
    KEYCODE_FOR_0 = 48;
    KEYCODE_FOR_9 = 57;
    account$: Observable<Account>;
    constructor(
        private readonly datepipe: DatePipe,
        private readonly ngrxStore: NGRXStore,
        private readonly domSanitizer: DomSanitizer,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly dateService: DateService,
    ) {}
    /**
     * @param date as string
     * @returns Date
     * current date time zone offset
     */
    getCurrentTimezoneOffsetDate(dateVal: string): Date {
        const d = new Date(dateVal);
        const TIME_ZONE_OFFSET_IN_HOURS = d.getTimezoneOffset() * MINUTE_IN_MILLISECONDS;
        return new Date(TIME_ZONE_OFFSET_IN_HOURS > 0 ? d.getTime() + TIME_ZONE_OFFSET_IN_HOURS : d.getTime() - TIME_ZONE_OFFSET_IN_HOURS);
    }
    /**
     * check for number validation, user can enter only number.
     * @param event keyboard event of user entered key
     */
    numberValidation(event: KeyboardEvent): void {
        if (
            event.type === KEYPRESS &&
            !(event.key.toString().charCodeAt(0) <= this.KEYCODE_FOR_9 && event.key.toString().charCodeAt(0) >= this.KEYCODE_FOR_0)
        ) {
            event.preventDefault();
        }
    }
    bindDialogOpenAndClose(dialogRef: MatDialogRef<any>): void {
        const bodyElement = document.querySelector("body");

        dialogRef.afterClosed().subscribe(() => {
            bodyElement.classList.remove("dialog-open-screen-blur");
        });
        dialogRef.afterOpened().subscribe(() => {
            bodyElement.classList.add("dialog-open-screen-blur");
        });
    }

    /**
     * Returns either HTML content for the tooltip on a notification badge or a list of notifications grouped by category,
     * depending on the 'type' param
     * @param notifications list of notifications
     * @param type string indicating the type of the return value,
     * @returns HTML content if type is 'notificationToolTip', otherwise a list of notifications grouped by category
     */
    getNotificationToolTip(notifications: any, type?: string): any {
        if (notifications && notifications.length > 0) {
            const filteredNotifications = notifications.reduce((groups, notification) => {
                const code = notification;
                const category = notification.category; // Need to change property category once API changes completed
                if (!groups[category]) {
                    groups[category] = [];
                }
                groups[category].push(code);
                return groups;
            }, {});
            // Count buttons
            const keys = Object.keys(filteredNotifications);
            const modifiedFilteredNotifications = [];
            keys.forEach((key) => {
                modifiedFilteredNotifications.push({
                    category: key,
                    categorizedObj: filteredNotifications[key],
                });
            });

            modifiedFilteredNotifications.sort((a, b) => {
                if (a.category < b.category) {
                    return -1;
                }
                if (a.category > b.category) {
                    return 1;
                }
                return 0;
            });

            const newModifiedFilterNotification = modifiedFilteredNotifications;
            const checkCategoryExistence = (categoryParam) =>
                modifiedFilteredNotifications.some(({ category }) => category === categoryParam);

            if (!checkCategoryExistence(NotificationTypes.CTA)) {
                newModifiedFilterNotification.push({
                    category: NotificationTypes.CTA,
                    categorizedObj: [{}],
                });
            }
            if (!checkCategoryExistence(NotificationTypes.REMINDER)) {
                newModifiedFilterNotification.push({
                    category: NotificationTypes.REMINDER,
                    categorizedObj: [{}],
                });
            }
            if (!checkCategoryExistence(NotificationTypes.UPDATE)) {
                newModifiedFilterNotification.push({
                    category: NotificationTypes.UPDATE,
                    categorizedObj: [{}],
                });
            }
            if (type === "notificationToolTip") {
                return modifiedFilteredNotifications
                    .filter(
                        (notification) =>
                            filteredNotifications[notification.category] && filteredNotifications[notification.category].length,
                    )
                    .map((notification) => this.getcategorizedNotification(filteredNotifications[notification.category]))
                    .join("<div class='dotted-line-bottom'></div>");
            }
            return newModifiedFilterNotification;
        }
    }

    getcategorizedNotification(category: any): string {
        const categorizedObjSort = category.sort((a, b) => {
            if (a.displayText < b.displayText) {
                return -1;
            }
            if (a.displayText > b.displayText) {
                return 1;
            }
            return 0;
        });

        // Reduce the sorted array in to new list of descriptions and counts
        const notificationDisplayCounts: { displayText: string; count: number }[] = categorizedObjSort.reduce((accumulator, value) => {
            const foundDisplaySummary = accumulator.find((displayCount) => displayCount.displayText === value.displayText);
            // If you find the display text, increment the sum by the count, or 1 if there is no count
            if (foundDisplaySummary) {
                foundDisplaySummary.count = foundDisplaySummary.count + (value["count"] ? value["count"] : 1);
                // otherwise, make a new list element and start with the count or 1 if not available
            } else {
                if (value.displayText) {
                    accumulator.push({ displayText: value.displayText, count: value["count"] ? value["count"] : 1 });
                } else {
                    accumulator.push({ displayText: value.code.displayText, count: value["count"] ? value["count"] : 1 });
                }
            }
            return accumulator;
        }, []);

        // Combine the reduced / counted display texts into a single HTML value.
        return notificationDisplayCounts.reduce((accumulator, value) => `${accumulator}${value.count} ${value.displayText}\n`, "");
    }

    hasNotificationTriggered(notificationFlag: boolean): void {
        this.isNotificationTriggered.emit(notificationFlag);
    }

    setSidenav(notificationSidenav: MatSidenav): any {
        this.notificationSidenav = notificationSidenav;
    }

    open(): any {
        return this.notificationSidenav.open();
    }

    close(): any {
        return this.notificationSidenav.close();
    }

    toggle(): void {
        this.notificationSidenav.toggle();
    }

    setTotalNotificationCount(notificationCount: number): void {
        this.notificationCount = notificationCount;
    }
    getTotalNotificationCount(): number {
        return this.notificationCount;
    }
    setMpGroup(mpGroup: number): void {
        this.mpGroup = mpGroup;
        this.mpGroupUpdated.emit(this.mpGroup);
    }

    setPortalTabName(tabName: string): void {
        this.hasNotificationTriggered(true);
        this.portalTabName.emit(tabName);
    }

    // Deep copy function for objects containing arrays and viceversa
    copy(data: any, objMap?: WeakMap<any, any>): any {
        if (!objMap) {
            // Map for handle recursive objects
            objMap = new WeakMap();
        }

        // recursion wrapper
        const deeper = (value) => {
            if (value && typeof value === "object") {
                return this.copy(value, objMap);
            }
            return value;
        };

        // Array value
        if (Array.isArray(data)) {
            return data.map(deeper);
        }

        // Object value
        if (data && typeof data === "object") {
            // Same object seen earlier
            if (objMap.has(data)) {
                return objMap.get(data);
            }
            // Date object
            if (data instanceof Date) {
                const result = this.dateService.toDate(data.valueOf());
                objMap.set(data, result);
                return result;
            }
            // Use original prototype
            const node = Object.create(Object.getPrototypeOf(data));
            // Save object to map before recursion
            objMap.set(data, node);
            for (const [key, value] of Object.entries(data)) {
                node[key] = deeper(value);
            }
            return node;
        }
        // Scalar value
        return data;
    }
    setRefreshActivity(flag: boolean): void {
        this.refreshActivity = flag;
    }
    /**
     *  method to retrieve refresh account info
     * @returns Observable of boolean
     */
    getRefreshActivity(): Observable<boolean> {
        const simpleObservable = new Observable<boolean>((observer) => {
            observer.next(this.refreshActivity);
            observer.complete();
        });
        return simpleObservable;
    }
    /**
     *  Method for invoking Notification messages
     * @returns Nothing
     */
    invokeNotification(): void {
        this.invokeNotification$.next(true);
    }

    /**
     * Method used to access the private variable invokeNotification
     * @returns BehaviorSubject<boolean>.
     */
    getNotificationStatus(): BehaviorSubject<boolean> {
        return this.invokeNotification$;
    }

    isPastDate(dateToCheck: string): boolean {
        let retValue = false;
        const date = new Date();
        const inputDate = this.toDate(dateToCheck);
        date.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        if (inputDate >= date) {
            retValue = true;
        }
        return retValue;
    }
    getMomentDateObject(date: any): string {
        return this.datepipe.transform(this.toDate(date), DateFormats.YEAR_MONTH_DAY);
    }

    /**
     * Convert string to date based on the input date format
     * @param date in string format
     */
    toDate(date: string): Date {
        if (typeof date === "string" && date.includes(HYPHEN)) {
            return this.dateService.parseDate(date, DateFormats.YEAR_MONTH_DAY);
        }
        return this.dateService.getToDate(this.dateService.toDate(date));
    }

    refactorTooltip(data: any[], title?: string): any {
        if (data && data.length && data.length > 30) {
            let str = "";
            data.forEach((x) => {
                str = str + "<div>" + x + "</div>";
            });

            if (title) {
                return this.domSanitizer.bypassSecurityTrustHtml(
                    `<div><span style="margin-left:5px;"><b>${title}</b></span> <br/>
                        <div class ="main-wrapper-div-tooltip-outer">
                            ${str}
                        </div>
                    </div>`,
                );
            }

            return this.domSanitizer.bypassSecurityTrustHtml(
                `<div>
                        <div class ="main-wrapper-div-tooltip-outer">
                            ${str}
                        </div>
                </div>`,
            );
        }
        if (data && data.length && data.length > 10) {
            const leftColCount = (data.length + (data.length % 2)) / 2;
            const leftColData = data.slice(0, leftColCount).join("</br>");
            const rightColData = data.slice(leftColCount).join("</br>");
            if (title) {
                return this.domSanitizer.bypassSecurityTrustHtml(
                    `<div><span><b>${title}</b></span> <br/>
                        <div class ="main-wrapper-div-tooltip-outer-second" style="display: flex">
                            <div class="col-left">${leftColData}</div>
                            <div class="col-right">${rightColData}</div>
                        </div>
                    </div>`,
                );
            }

            return this.domSanitizer.bypassSecurityTrustHtml(
                `<div>
                    <div class ="main-wrapper-div-tooltip-outer-second" style="display: flex">
                        <div class="col-left">${leftColData}</div>
                        <div class="col-right">${rightColData}</div>
                    </div>
                </div>`,
            );
        }

        const dataLessThan10 = data.join("</br>");
        if (title) {
            return this.domSanitizer.bypassSecurityTrustHtml(`<div><span><b>${title}</b></span> <br/>${dataLessThan10}</div>`);
        }
        return this.domSanitizer.bypassSecurityTrustHtml(`<div>${dataLessThan10}</div>`);
    }

    formatPhoneNumber(phoneNumber: string): string {
        return phoneNumber.slice(0, 3) + "-" + phoneNumber.slice(3, 6) + "-" + phoneNumber.slice(6, 10);
    }
    resetAppFocus(): void {
        if (document.getElementById("appFocusResetElement")) {
            document.getElementById("appFocusResetElement").focus();
        }
    }
    /**
     * to get the specific tax benefit type
     * @param taxStatus tax status of selected plan choice
     * @returns tax status fetched from language strings
     */
    getTaxBenefitType(taxStatus: string): string {
        const languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.benefitsOffering.preTaxBenefit",
            "primary.portal.benefitsOffering.postTaxBenefit",
            "primary.portal.benefitsOffering.preTaxAndPostTax",
        ]);
        if (taxStatus === PRETAX) {
            return languageStrings["primary.portal.benefitsOffering.preTaxBenefit"];
        }
        if (taxStatus === POST_TAX) {
            return languageStrings["primary.portal.benefitsOffering.postTaxBenefit"];
        }
        return languageStrings["primary.portal.benefitsOffering.preTaxAndPostTax"];
    }
    /**
     * Ths method will gather data related to permission and get account.
     * @param permissionString fetched permission
     * @param mpGroupId group-id
     * @returns Observable of boolean, Accounts
     */
    checkDisableForRole12Functionalities(permissionString: string, mpGroupId: string): Observable<[boolean, Accounts]> {
        this.ngrxStore.dispatch(
            loadAccount({
                mpGroup: Number(mpGroupId),
            }),
        );
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: Number(mpGroupId) }));
        this.account$ = this.ngrxStore.onAsyncValue(select(getSelectedAccount));
        return combineLatest([
            this.staticUtilService.hasPermission(permissionString),
            this.account$,
            checkIfAbleToAccessModuleInHQAccount(this.staticUtilService, this.accountService, null, null, +mpGroupId),
        ]).pipe(
            // MON-51147 - do not impose any restrictions on a TPP account that is also an HQ account
            map(
                ([restrictionsEnabled, account, isNonHQAccount]) => [isNonHQAccount && restrictionsEnabled, account] as [boolean, Accounts],
            ),
        );
    }
    /**
     * Ths method will return true/false based on if the policy is expired.
     * @param filteredQualifyingEvent filtered qualifying event based on the product
     * @param endPlanRequestStatus end plan request status value
     * @returns {boolean}
     */
    checkPolicyExpired(filteredQualifyingEvent: MemberQualifyingEvent, endPlanRequestStatus: string): boolean {
        const endCoverageDate = (filteredQualifyingEvent || ({} as MemberQualifyingEvent)).requestedCoverageEndDate;
        return (
            endPlanRequestStatus === QLEEndPlanRequestStatus.COVERAGE_CANCELLED &&
            endCoverageDate &&
            this.dateService.toDate(endCoverageDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0) < 0
        );
    }
    /**
     * Update pda link on pda form submission
     * @param formType Form Type
     * @param isSubmitted true when pda form submitted
     */
    updateFormSubmission(formType: string, isSubmitted: boolean): void {
        this.formSubmit$.next({
            formType: formType,
            formSubmitted: isSubmitted,
        });
    }

    /**
     * This method will check if we should show the wellthie link
     * @return Observable<boolean> to show or hide wellthie link
     */
    showWellthieLink(): Observable<boolean> {
        return this.staticUtilService
            .cacheConfigValue(ConfigName.WELLTHIE_AGENT_LEVEL)
            .pipe(map((config) => config !== DEFAULT_AGENT_LEVEL));
    }
    /**
     * return if param is vowel or not
     * @param char character to be checked
     * @returns whether the character passed as param is vowel
     */
    isVowel(char: string): boolean {
        return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
    }
    /**
     * This method is used to validate whether the entered value is a number with one decimal point and 2 decimal places or not
     * This checks if the input has only one decimal place like 40.33 and not 40.22.2223.34 or 50.....45 or 50.324
     * @param value is the value entered
     * @returns string value which is formatted to the accepted number entry format
     */
    formatDecimalNumber(value: string): string {
        if (value.indexOf(".") >= 0) {
            const firstPart = value.substr(0, value.indexOf(".") + SUBSTRING_LENGTH);
            const secondPart = value.substr(value.indexOf(".") + SUBSTRING_LENGTH, VALUE_LIMIT);
            if (secondPart.indexOf(".") < 0) {
                value = firstPart + secondPart;
            } else {
                value = firstPart + value.substr(value.indexOf(".") + SUBSTRING_LENGTH, secondPart.indexOf("."));
            }
        }
        return value;
    }
    /**
     * This method returns true or false based on the zipcode validation
     * @param state state to validate
     * @param zipCode zip to validate
     * @returns observable of true/false based on response status, false on error
     */
    validateZip(state: string, zipCode: string): Observable<boolean> {
        return this.staticService.validateStateZip(state, zipCode).pipe(
            map((response) => response.status === SuccessResponseCode.RESP_204),
            catchError(() => of(false)),
        );
    }

    /**
     * set email and phone details of member to send unsigned pda
     * @param memberContact all contact details of member
     */
    getFormattedMemberContacts(memberContact: MemberContact[]): MemberContactListDisplay[] {
        const languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.headset.noemailaddress",
            "primary.portal.headset.nomobile",
        ]);
        const contactList: MemberContactListDisplay[] = [];
        memberContact.forEach((contact) => {
            if (contact.emailAddresses?.length) {
                contactList.push(
                    ...contact.emailAddresses.map((emailAddress) => ({
                        contact: emailAddress.email,
                        disableField: false,
                        type: EMAIL,
                        primary: contact.primary,
                    })),
                );
            } else if (!contactList.some((contactData) => contactData.type === EMAIL)) {
                contactList.push({
                    contact: languageStrings["primary.portal.headset.noemailaddress"],
                    disableField: true,
                });
            }
            if (contact.phoneNumbers?.length) {
                contactList.push(
                    ...contact.phoneNumbers.map((phoneContact) => ({
                        contact: phoneContact.phoneNumber,
                        disableField: false,
                        type: PHONE,
                        formatted: this.formatPhoneNumber(phoneContact.phoneNumber),
                    })),
                );
            } else if (!contactList.some((contactData) => contactData.type === PHONE)) {
                contactList.push({
                    contact: languageStrings["primary.portal.headset.nomobile"],
                    disableField: true,
                });
            }
        });
        return contactList;
    }

    /**
     * this method is used to add zeroes before the value
     * @param value the value to add leading zeroes
     * @param totalDigitCount total number of zeroes before value
     * @returns return string with leading zeroes on value
     */
    getStringWithLeadingZeroes(value: string, totalDigitCount: number): string {
        const precedingDigit = "0".repeat(totalDigitCount);
        return (precedingDigit + value).substr(-totalDigitCount);
    }

    /**
     * This method is used to masked the value with *
     * @param value this indicates the value to be mask
     * @param totalDigitCount indicate the total number of STAR(*) need to be added before the value
     */
    getMaskedString(value: string, totalDigitCount: number): string {
        return STAR.repeat(totalDigitCount) + value;
    }
}
