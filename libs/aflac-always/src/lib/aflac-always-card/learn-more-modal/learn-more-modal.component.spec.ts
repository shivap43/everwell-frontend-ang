import { ComponentFixture, TestBed } from "@angular/core/testing";

import { LearnMoreModalComponent } from "./learn-more-modal.component";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { mockLanguageService, mockMatDialog, mockRouter, mockStore, mockTpiService } from "@empowered/testing";
import { NGRXStore } from "@empowered/ngrx-store";
import { Store } from "@ngrx/store";
import { AflacAlwaysHelperService } from "../../enroll-aflac-always-modal/services/aflac-always-helper.service";
import { TpiServices } from "@empowered/common-services";
import { Router } from "@angular/router";
import { EnrollAflacAlwaysModalComponent } from "../../enroll-aflac-always-modal/enroll-aflac-always-modal.component";

const mockData = {
    mpGroupId: 1,
    memberId: 1,
    showEnrollmentMethod: true,
};

describe("LearnMoreModalComponent", () => {
    let component: LearnMoreModalComponent;
    let fixture: ComponentFixture<LearnMoreModalComponent>;
    let matDialogRef: MatDialogRef<LearnMoreModalComponent>;
    let languageService: LanguageService;
    let matDialog: MatDialog;

    const mockMatDialogRef = {
        close: () => {},
    } as MatDialogRef<LearnMoreModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LearnMoreModalComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockData,
                },
                NGRXStore,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                AflacAlwaysHelperService,
                { provide: TpiServices, useValue: mockTpiService },
                { provide: Router, useValue: mockRouter },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LearnMoreModalComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
        matDialog = TestBed.inject(MatDialog);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call helper function", () => {
            const spy = jest.spyOn(component, "fetchLanguageStrings");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("fetchLanguageStrings()", () => {
        it("should initialize languageStrings array", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.languageStrings = null;
            component.fetchLanguageStrings();
            expect(spy).toBeCalled();
            expect(component.languageStrings).toBeTruthy();
        });
    });

    describe("enrollInAflacAlways()", () => {
        it("should close modal", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            const spy2 = jest.spyOn(matDialog, "open");
            component.enrollInAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });

        it("should open AA Quasi modal if flow is TPI and is link and launch", () => {
            const spy = jest.spyOn(matDialog, "open");
            component.memberInfo.isTpi = true;
            component.enrollInAflacAlways();
            expect(spy).toHaveBeenCalledWith(EnrollAflacAlwaysModalComponent, {
                data: {
                    mpGroupId: 1,
                    memberId: 1,
                    showEnrollmentMethod: true,
                },
            });
        });
    });
});
