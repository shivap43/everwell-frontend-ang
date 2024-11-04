import { Component, OnInit, OnDestroy } from "@angular/core";
import { AccountListState, StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { ExceptionFormComponent, ExceptionFormAction } from "./exception-form/exception-form.component";
import { combineLatest, Subscription } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { ConfigName, Permission, AppSettings, Exceptions, ExceptionType } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { filter } from "rxjs/operators";
import { SetPINSignatureExceptions, EnrollmentOptionsState } from "@empowered/ngxs-store";
import { ExceptionFormType } from "../models/manage-call-center.model";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-enrollment-exceptions",
    templateUrl: "./enrollment-exceptions.component.html",
    styleUrls: ["./enrollment-exceptions.component.scss"],
})
export class EnrollmentExceptionsComponent implements OnInit, OnDestroy {
    mpGroup: string;
    exceptions: Exceptions[];
    subscriptions: Subscription[] = [];
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    displayedColumns = ["exceptionType", "startDate", "endDate", "approvedBy"];
    dataSource = new MatTableDataSource([]);
    canAddException: boolean;
    exceptionTypes: string[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.remove",
        "primary.portal.common.moreFilter",
        "primary.portal.pinSignature.enrollmentExceptions",
        "primary.portal.pinSignature.addException",
        "primary.portal.pinSignature.exceptionType",
        "primary.portal.pinSignature.startDate",
        "primary.portal.pinSignature.endDate",
        "primary.portal.pinSignature.approvedBy",
        "primary.portal.pinSignature.manage",
        "primary.portal.pinSignature.pinSignatureException",
    ]);

    constructor(
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        this.mpGroup = this.store.selectSnapshot(AccountListState.getMpGroupId).toString();
    }

    /**
     * Angular lifecycle hook OnInit. Calling the get exceptions api.
     * Get permission call to check if user has permission to add pin signature exception.
     */
    ngOnInit(): void {
        this.getPermissions();
        this.getExceptions();
    }

    /**
     * Method to get exceptions and set the table data.
     */
    getExceptions(): void {
        this.subscriptions.push(
            combineLatest([
                this.store.select(EnrollmentOptionsState.getAllowedExceptionTypes),
                this.store.select(EnrollmentOptionsState.getPINSignatureExceptions),
                this.store.select(AccountListState.getGroup),
                this.staticUtilService.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES),
            ]).subscribe(([exceptionTypes, exceptions, account, disabilityEnrollmentMinEmployees]) => {
                this.exceptionTypes =
                    account.employeeCount >= +disabilityEnrollmentMinEmployees
                        ? exceptionTypes.filter((exceptionType) => exceptionType !== ExceptionType.ALLOWED_DISABILITY_ENROLLMENT)
                        : exceptionTypes;
                this.exceptions =
                    exceptions?.map((exception) => ({
                        ...exception,
                        name: this.language.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exception.type}`),
                        approvingProducer: {
                            ...exception.approvingProducer,
                            name: [exception.approvingProducer.fullName.lastName, exception.approvingProducer.fullName.firstName].join(
                                ", ",
                            ),
                        },
                        isExpired: this.dateService.isBefore(this.dateService.toDate(exception.validity.expiresAfter)),
                    })) ?? [];
                this.dataSource.data = this.exceptions;
            }),
        );
    }

    /**
     * Method to open the exception form modal based on action
     * @param action : action to perform Add/Edit/Delete exception
     * @param exception : optional param to be sent in case of edit/delete.
     */
    openExceptionForm(action: ExceptionFormAction, exception?: Exceptions): void {
        this.subscriptions.push(
            this.empoweredModalService
                .openDialog(ExceptionFormComponent, {
                    data: {
                        action: action,
                        inputData: exception,
                        exceptionTypes: action === ExceptionFormType.EDIT ? [exception.type] : this.exceptionTypes,
                    },
                })
                .afterClosed()
                .subscribe((resp: ExceptionFormAction) => {
                    if (resp === ExceptionFormType.ADD || resp === ExceptionFormType.EDIT || resp === ExceptionFormType.REMOVE) {
                        this.store.dispatch(new SetPINSignatureExceptions(+this.mpGroup));
                    }
                }),
        );
    }
    /**
     * Method to check if user has permission to add an enrollment exception
     */
    getPermissions(): void {
        this.subscriptions.push(
            this.staticUtilService
                .hasPermission(Permission.ADD_PIN_SIGNATURE_EXCEPTION)
                .pipe(filter((response) => response === true))
                .subscribe((response) => {
                    this.canAddException = true;
                    this.displayedColumns.push("manage");
                }),
        );
    }

    /**
     * Angular lifecycle hook called on component destruction. All subscriptions are unsubscribed.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
