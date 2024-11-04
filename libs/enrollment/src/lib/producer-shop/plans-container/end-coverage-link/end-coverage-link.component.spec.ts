import { ComponentType } from "@angular/cdk/portal";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { provideMockStore } from "@ngrx/store/testing";
import { of } from "rxjs";

import { EndCoverageLinkComponent } from "./end-coverage-link.component";
import { TemplateRef } from "@angular/core";
import { BenefitOfferingUtilService } from "@empowered/ui";
import { Name, Validity, TaxStatus, Enrollments, MemberProfile, Admin } from "@empowered/constants";
import { EnrolledDetailData, EndCoverageModalInput } from "./end-coverage-link.model";
import { BenefitSummaryService, EmpoweredModalService } from "@empowered/common-services";
import { EndCoverageComponent } from "../../../benefit-summary/end-coverage/end-coverage.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { mockProducerShopHelperService } from "@empowered/testing";

const mockMatDialog = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as EmpoweredModalService;

const mockBenefitOfferingUtilService = {
    addAdminPopUp: () => of(null),
    addAdmin: (adminList: Admin[], choice: string) => of(false),
} as BenefitOfferingUtilService;

const mockBenefitSummaryService = {
    setEndCoverageFlag: (hasAdmin: boolean) => null,
} as BenefitSummaryService;

const enrollmentDetailsData = {
    mpGroup: 123473,
    memberId: 123,
    selectedEnrolledData: {
        id: 1,
        taxStatus: TaxStatus.PRETAX,
        validity: { expiresAfter: "05/09/2021", effectiveStarting: "05/10/2020" } as Validity,
        plan: { name: "Accident | option 1" },
    } as Enrollments,
    memberDetail: { id: 123, name: { firstName: "Max", lastName: "well" } as Name } as MemberProfile,
} as EnrolledDetailData;

describe("EndCoverageLinkComponent", () => {
    let component: EndCoverageLinkComponent;
    let fixture: ComponentFixture<EndCoverageLinkComponent>;
    let benefitSummaryService: BenefitSummaryService;
    let empoweredModalService: EmpoweredModalService;
    let benefitOfferingUtilService: BenefitOfferingUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EndCoverageLinkComponent],
            providers: [
                NGRXStore,
                provideMockStore({}),
                {
                    provide: BenefitSummaryService,
                    useValue: mockBenefitSummaryService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: BenefitOfferingUtilService,
                    useValue: mockBenefitOfferingUtilService,
                },
                {
                    provide: ProducerShopHelperService,
                    useValue: mockProducerShopHelperService,
                },
            ],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EndCoverageLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        benefitSummaryService = TestBed.inject(BenefitSummaryService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        benefitOfferingUtilService = TestBed.inject(BenefitOfferingUtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("handleClick()", () => {
        it("should emit click event", () => {
            const spy = jest.spyOn(component["clicked$"], "next");
            component.handleClick();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
    describe("openEndCoveragePopup()", () => {
        it("should open add admin popup", () => {
            const hasAccountAdmin = false;
            const spy = jest.spyOn(benefitSummaryService, "setEndCoverageFlag").mockImplementation(() => {});
            const spy2 = jest.spyOn(component, "openAddAdminPopup").mockImplementation();
            component.openEndCoveragePopup(enrollmentDetailsData, hasAccountAdmin);
            expect(spy).toBeCalledWith(true);
            expect(spy2).toBeCalledWith(enrollmentDetailsData);
        });
        it("should open dialog to end the coverage", () => {
            enrollmentDetailsData.selectedEnrolledData.taxStatus = TaxStatus.POSTTAX;
            const hasAccountAdmin = false;
            const spy1 = jest.spyOn(empoweredModalService, "openDialog");
            const spy2 = jest.spyOn(component, "getEndCoverageModalInput").mockReturnValueOnce({ memberId: 12 } as EndCoverageModalInput);
            component.openEndCoveragePopup(enrollmentDetailsData, hasAccountAdmin);
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("getEndCoverageModalInput()", () => {
        it("should return data to populate the EndCoverageComponent dialog modal", () => {
            enrollmentDetailsData.selectedEnrolledData.taxStatus = TaxStatus.POSTTAX;
            expect(component.getEndCoverageModalInput(enrollmentDetailsData)).toStrictEqual({
                memberId: enrollmentDetailsData.memberId,
                mpGroup: enrollmentDetailsData.mpGroup,
                enrollmentId: enrollmentDetailsData.selectedEnrolledData.id,
                enrollmentTaxStatus: enrollmentDetailsData.selectedEnrolledData.taxStatus,
                expiresAfter: enrollmentDetailsData.selectedEnrolledData.validity.expiresAfter,
                planName: enrollmentDetailsData.selectedEnrolledData.plan.name,
                employeeName: `${enrollmentDetailsData.memberDetail.name.firstName} ${enrollmentDetailsData.memberDetail.name.lastName}`,
                isShop: true,
                isArgus: false,
                coverageStartDate: enrollmentDetailsData.selectedEnrolledData.validity.effectiveStarting,
            } as EndCoverageModalInput);
        });
    });
    describe("addAdmin", () => {
        it("should open end coverage pop up after adding admin successfully", (done) => {
            expect.assertions(3);
            const spy = jest.spyOn(benefitOfferingUtilService, "addAdmin").mockReturnValueOnce(of(true));
            const spy2 = jest.spyOn(component, "openEndCoveragePopupAfterAdminAddition").mockImplementation(
                (enrolledDetailData: EnrolledDetailData) =>
                    ({
                        afterClosed: () => of(),
                    } as MatDialogRef<EndCoverageComponent>),
            );
            component.addAdmin("true", [], enrollmentDetailsData).subscribe((status) => {
                expect(status).toBe(true);
                expect(spy2).toBeCalledTimes(1);
                expect(spy).toBeCalledTimes(1);
                done();
            });
        });
    });
});
