import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MockReplaceTagPipe, mockMatDialog, mockMatDialogRef, mockMemberService, mockRouter } from "@empowered/testing";
import { AddNewQleComponent } from "./add-new-qle.component";
import { NgxsModule } from "@ngxs/store";
import { DatePipe } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { MaskApplierService, NgxMaskPipe, NgxMaskModule } from "ngx-mask";
import { Actions, MemberService, NewHireRule, AflacService, Attribute } from "@empowered/api";
import { Subject, of } from "rxjs";
import { Router } from "@angular/router";

describe("AddNewQleComponent", () => {
    let component: AddNewQleComponent;
    let fixture: ComponentFixture<AddNewQleComponent>;
    let memberService: MemberService;
    let router: Router;
    let maskPipe: NgxMaskPipe;
    let aflacService: AflacService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddNewQleComponent, MockReplaceTagPipe],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                DatePipe,
                NgxMaskPipe,
                MaskApplierService,
                { provide: MemberService, useValue: mockMemberService },
                { provide: Router, useValue: mockRouter },
            ],
            imports: [NgxsModule.forRoot(), ReactiveFormsModule, HttpClientModule, NgxMaskModule.forRoot()],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddNewQleComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        router = TestBed.inject(Router);
        maskPipe = TestBed.inject(NgxMaskPipe);
        aflacService = TestBed.inject(AflacService);
    });

    describe("AddNewQleComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("closeForm()", () => {
            it("should close the dialog", () => {
                const closeSpy = jest.spyOn(component["dialogRef"], "close");
                const memberServiceUpdateQleListSpy = jest.spyOn(memberService, "updateQLEList");
                component.closeForm();
                expect(closeSpy).toBeCalled();
                expect(memberServiceUpdateQleListSpy).toBeCalledWith(false);
            });
        });

        describe("goToRules()", () => {
            it("should close the dialog and redirect to profile rules", () => {
                component.routeAfterLogin = "sample-route";
                component.mpGroupId = 123;
                const refCloseSpy = jest.spyOn(component["dialogRef"], "close");
                const routerSpy = jest.spyOn(router, "navigate");
                component.goToRules();
                expect(refCloseSpy).toBeCalled();
                expect(routerSpy).toBeCalledWith([
                    component.routeAfterLogin + "/payroll/" + component.mpGroupId + "/dashboard/profile/rules",
                ]);
            });
        });

        describe("transform()", () => {
            it("should mask the input as 00/00/0000", () => {
                const input = { target: { value: "11122023" } };
                component.transform(input);
                expect(input.target.value).toBe("11/12/2023");
            });
        });

        describe("ngOnDestroy()", () => {
            it("should cleanup subscriptions", () => {
                const nextSpy = jest.spyOn(Subject.prototype, "next");
                const complete = jest.spyOn(Subject.prototype, "complete");
                component.ngOnDestroy();
                expect(nextSpy).toBeCalled();
                expect(complete).toBeCalled();
            });
        });

        describe("checkNewHireRules()", () => {
            beforeEach(() => {
                component.coverageStartReferenceText = "coverageStartReference";
                component.daysAfterCoverageStartReferenceText = "daysAfterCoverageStartReference";
                component.coverageStartText = "coverageStart";
            });
            const action = {
                attributes: [
                    {
                        name: "daysAfterCoverageStartReference",
                        value: 11,
                    },
                    {
                        name: "coverageStart",
                        value: 15,
                    },
                    {
                        name: "coverageStartReference",
                        value: "coverageStartReferenceText",
                    },
                ],
            } as Actions;
            it("should set the coverageStart, daysAfterCoverageStartRef, coverageStartReference based on the action attribute's value", () => {
                component.checkNewHireRules(action);
                expect(component.coverageStart).toBe(15);
                expect(component.daysAfterCoverageStartRef).toBe(11);
                expect(component.coverageStartReference).toBe("coverageStartReferenceText");
            });
        });

        describe("getDateError()", () => {
            beforeEach(() => {
                component.isNewHire = false;
                component.form = new FormGroup({
                    eventDate: new FormControl(""),
                });
            });
            it("should set the date error as empty when not a new hire", () => {
                const date = component.getDateError();
                expect(date).toBe("");
            });
        });

        describe("getNewHireRules()", () => {
            it("should set the enrollment window if type is of 'NEW_HIRE' and code is 'CREATE_QLE'", () => {
                component.enrollmentWindowLengthText = "enrollmentWindow";
                jest.spyOn(aflacService, "getNewHireRules").mockReturnValueOnce(
                    of([
                        {
                            id: 7,
                            type: "NEW_HIRE",
                            actions: [
                                {
                                    code: "CREATE_QLE",
                                    attributes: [
                                        {
                                            name: "enrollmentWindow",
                                            value: "1",
                                            required: true,
                                        } as Attribute,
                                    ],
                                },
                            ],
                        } as NewHireRule,
                    ]),
                );
                component.getNewHireRules();
                expect(component.enrollmentWindow).toBe(1);
            });
        });

        describe("applyDateRange()", () => {
            beforeEach(() => {
                component.minEventDate = new Date("11-11-2000");
                component.maxEventDate = new Date("11-11-2002");
            });

            it("should return true as the date is between minEventDate & maxEventDate", () => {
                expect(component.applyDateRange(new Date("11-11-2001"))).toBe(true);
            });
            it("should return false as the date is greater than maxEvent date", () => {
                expect(component.applyDateRange(new Date("11-11-2011"))).toBe(false);
            });
        });
    });
});
