import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AflacAlwaysCardComponent } from "./aflac-always-card.component";
import { LanguageService } from "@empowered/language";
import { EmpoweredModalService, TpiServices } from "@empowered/common-services";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import {
    mockLanguageService,
    mockEmpoweredModalService,
    mockMatDialog,
    mockStore,
    mockTpiService,
    mockRouter,
    mockAppFlowService,
} from "@empowered/testing";
import { AflacAlwaysHelperService } from "../enroll-aflac-always-modal/services/aflac-always-helper.service";
import { MatDialog } from "@angular/material/dialog";
import { NGRXStore } from "@empowered/ngrx-store";
import { Store } from "@ngrx/store";
import { Router } from "@angular/router";
import { EnrollAflacAlwaysModalComponent } from "../enroll-aflac-always-modal/enroll-aflac-always-modal.component";
import { AppFlowService } from "@empowered/ngxs-store";
import { BehaviorSubject } from "rxjs";

describe("AflacAlwaysCardComponent", () => {
    let component: AflacAlwaysCardComponent;
    let fixture: ComponentFixture<AflacAlwaysCardComponent>;
    let languageService: LanguageService;
    let empoweredModalService: EmpoweredModalService;
    let aflacAlwaysHelperService: AflacAlwaysHelperService;
    let matDialog: MatDialog;
    let appFlowService: AppFlowService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AflacAlwaysCardComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                AflacAlwaysHelperService,
                NGRXStore,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                { provide: TpiServices, useValue: mockTpiService },
                { provide: Router, useValue: mockRouter },
                { provide: AppFlowService, useValue: mockAppFlowService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AflacAlwaysCardComponent);
        component = fixture.componentInstance;
        languageService = TestBed.inject(LanguageService);
        matDialog = TestBed.inject(MatDialog);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        aflacAlwaysHelperService = TestBed.inject(AflacAlwaysHelperService);
        appFlowService = TestBed.inject(AppFlowService);
        component.bodyLanguageString = "test";
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValue");
            component.ngOnInit();
            expect(spy).toBeCalled();
            expect(component.bodyLanguageString).toBe("test");
            expect(component.enrolledText).toBe("primary.portal.applicationFlow.confirmation.aflacAflaysCard.enrolled.buttonText");
            expect(component.isEnrolled).toBeFalsy();
        });

        it("should set isEnrolled flag appropriately", () => {
            aflacAlwaysHelperService.aflacAlwaysEnrolled$.next(null);
            expect(component.isEnrolled).toBeFalsy();

            aflacAlwaysHelperService.aflacAlwaysEnrolled$.next("OTHER");
            expect(component.isEnrolled).toBeTruthy();
        });

        it("should set header text", () => {
            component.headerLanguageString = "Aflac Always";
            component.ngOnInit();
            expect(component.headerText).toBe("Aflac Always");
            expect(component.isReviewEnrollmentPage).toBeFalsy();
        });

        it("should call getReviewAflacAlwaysStatus", () => {
            const mockReviewAflacAlwaysStatus = new BehaviorSubject("true");
            const spy = jest.spyOn(appFlowService, "getReviewAflacAlwaysStatus").mockReturnValue(mockReviewAflacAlwaysStatus);
            component.ngOnInit();
            expect(spy).toHaveBeenCalled();
            expect(component.reviewAflacAlwaysStatus).toEqual("true");
        });
    });

    describe("openLearnMoreModal()", () => {
        it("should open Learn More modal", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openLearnMoreModal();
            expect(spy).toBeCalled();
        });
    });

    describe("enrollInAflacAlways()", () => {
        it("should open Aflac Always quasimodal", () => {
            const spy = jest.spyOn(matDialog, "open");
            component.enrollInAflacAlways();
            expect(spy).toBeCalled();
        });

        it("should open AA Quasi modal if flow is TPI and is link and launch", () => {
            const spy = jest.spyOn(matDialog, "open");
            component.isTpi = true;
            const spy1 = jest.spyOn(mockTpiService, "isLinkAndLaunchMode").mockReturnValue(true);
            component.enrollInAflacAlways();
            expect(spy).toHaveBeenCalledWith(EnrollAflacAlwaysModalComponent, expect.anything());
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });

        it("should reset the aflacAlwaysEnrolled$ to false when component is destroyed", () => {
            const spy1 = jest.spyOn(aflacAlwaysHelperService.aflacAlwaysEnrolled$, "next");
            component.ngOnDestroy();
            expect(spy1).toHaveBeenCalledWith(null);
        });
    });

    describe("openReviewAflacAlwaysModal()", () => {
        it("should open Review Aflac Always Modal", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openReviewAflacAlwaysModal();
            expect(spy).toBeCalled();
        });
    });
});
