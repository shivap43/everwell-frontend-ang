import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { mockEmpoweredModalService, mockLanguageService, MockReplaceTagPipe, mockStaticService } from "@empowered/testing";

import { PreliminaryStatementComponent } from "./preliminary-statement.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { DatePipe } from "@angular/common";
import { RouterTestingModule } from "@angular/router/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { EmpoweredModalService } from "@empowered/common-services";
import { Subscription, of } from "rxjs";
import { MemberData, Operation, Option } from "@empowered/constants";
import { EnrollmentMethodState } from "@empowered/ngxs-store";
import { NGRXStore } from "@empowered/ngrx-store";
import { provideMockStore } from "@ngrx/store/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { PaperCopyModalComponent } from "./paper-copy-modal/paper-copy-modal.component";
import { EnrollmentsActions } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { StaticService } from "@empowered/api";
import { HttpResponse } from "@angular/common/http";

const preliminarySectionData = [
    {
        title: "Preliminary Statement of Policy Cost and Benefit Amount",
        showSection: true,
        steps: [
            {
                showStep: true,
                step: [
                    {
                        id: 123,
                        type: "",
                        title: "Preliminary Statement",
                        directions: "Preliminary Statement of Policy Cost",
                        body: "",
                        constraintAggregates: {
                            skip: { and: { constraints: [], or: { constraints: [] } } },
                            show: { and: { constraints: [], or: { constraints: [] } } },
                        },
                        question: {
                            id: 12,
                            key: "",
                            constraints: { type: "", operation: "EQUALS" as Operation, value: "" },
                            text: "Aflac Whole Life | 10 Year <a href=\"/resource/aflac/NY-16800.pdf\">View Form</a>",
                            inputType: "Text",
                            required: true,
                            readOnly: true,
                            options: [],
                        },
                    },
                    {
                        id: 124,
                        type: "",
                        title: "Preliminary Statement",
                        directions: "Preliminary Statement of Policy Cost",
                        body: "",
                        constraintAggregates: {
                            skip: { and: { constraints: [], or: { constraints: [] } } },
                            show: { and: { constraints: [], or: { constraints: [] } } },
                        },
                        question: {
                            id: 12,
                            key: "",
                            constraints: { type: "", operation: "EQUALS" as Operation, value: "" },
                            text: "Email",
                            inputType: "RADIO",
                            required: true,
                            readOnly: true,
                            options: [
                                {
                                    backToStepElement: "yes",
                                    backToStepLink: "No",
                                    value: "",
                                    label: "Preliminary Statement",
                                    constraints: [],
                                    knockoutType: {},
                                },
                            ] as Option[],
                        },
                    },
                ],
            },
        ],
    },
];

describe("PreliminaryStatementComponent", () => {
    let component: PreliminaryStatementComponent;
    let fixture: ComponentFixture<PreliminaryStatementComponent>;
    let store: Store;
    let stateForNgxsStore: Store;
    let empoweredModalService: EmpoweredModalService;
    let mockNgrxStore: NGRXStore;
    let staticService: StaticService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PreliminaryStatementComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                DatePipe,
                NGRXStore,
                provideMockStore({}),
            ],
            imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule, NgxsModule.forRoot([EnrollmentMethodState])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PreliminaryStatementComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        stateForNgxsStore = {
            ...store.snapshot(),
            EnrollmentMethodState: {
                memberDetails: { email: "abcd123@gmail.com" },
            },
            core: { regex: { EMAIL: "" } },
        };
        component.preliminaryStatementSections = preliminarySectionData;
        store.reset(stateForNgxsStore);
        mockNgrxStore = TestBed.inject(NGRXStore);
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize preliminaryStatementPlans and get emails of employee", () => {
            const spy1 = jest.spyOn(component, "getEmployeeEmails");
            const spy2 = jest.spyOn(staticService, "getConfigurations");
            component.ngOnInit();
            expect(component.preliminaryStatementPlans).toStrictEqual(["Aflac Whole Life | 10 Year"]);
            expect(component.emailNotification).toStrictEqual("Preliminary Statement");
            expect(component.preliminaryFormPaths).toStrictEqual(["/resource/aflac/NY-16800.pdf"]);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("getEmployeeEmails()", () => {
        it("should get memberContacts details, and when member has email ids they are pushed to preliminaryEmailOptions array ", () => {
            component.selectedMemberContacts$ = of({ contactInfo: [{ emailAddresses: [{ email: "abcd123@gmail.com" }] }] } as MemberData);
            component.getEmployeeEmails();
            expect(component.preliminaryEmailOptions).toStrictEqual(["Email abcd123@gmail.com"]);
        });

        it("should get memberContacts details, and when member doesn't have email ids then preliminaryEmailOptions array contain 'no email provided' value", () => {
            component.selectedMemberContacts$ = of({ contactInfo: [{ emailAddresses: [] }] } as MemberData);
            component.getEmployeeEmails();
            expect(component.preliminaryEmailOptions).toStrictEqual([
                "primary.portal.applicationFlow.preliminaryStatement.noEmail.provided.message",
            ]);
        });
    });

    describe("onNext()", () => {
        it("should direct to paper copy modal when preliminaryFormControl value is 'paperCopy'", () => {
            component.preliminaryFormControl.setValue("paperCopy");
            component.preliminaryFormPaths = ["resources/http/aflac/preliminaryForm.pdf"];
            component.memberId$ = of(123);
            component.mpGroup = 1234;
            component.cartIds = [12, 13, 14];
            const spy1 = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of({ routeToAppFlow: true }),
            } as MatDialogRef<PaperCopyModalComponent>);
            const spy2 = jest.spyOn(component, "routeToAppFlow");
            component.onNext();
            expect(spy1).toBeCalledWith(PaperCopyModalComponent, {
                data: {
                    preliminaryFormPaths: component.preliminaryFormPaths,
                    memberId$: component.memberId$,
                    mpGroupId: component.mpGroup,
                    cartIds: component.cartIds,
                },
            });
            expect(spy2).toBeCalled();
        });

        it("should mark differentEmail as touched when preliminaryFormControl value is 'differentEmail' and differentEmail for control is invalid", () => {
            component.preliminaryFormControl.setValue("differentEmail");
            component.differentEmail.setErrors({ required: true });
            component.onNext();
            expect(component.differentEmail.touched).toBe(true);
        });

        it("should send email and navigate to application flow when employee email is selected", () => {
            component.preliminaryFormControl.setValue("Email abcd123@gmail.com");
            const spy = jest.spyOn(component, "emailPreliminaryForms");
            component.onNext();
            expect(spy).toBeCalledWith("abcd123@gmail.com");
        });

        it("should send email and navigate to application flow when different email is selected", () => {
            component.preliminaryFormControl.setValue("differentEmail");
            component.differentEmail.setValue("abcd123@gmail.com");
            const spy = jest.spyOn(component, "emailPreliminaryForms");
            component.onNext();
            expect(spy).toBeCalledWith("abcd123@gmail.com");
        });
    });

    describe("emailPreliminaryForms()", () => {
        it("should email preliminary form(s) to the provided email", () => {
            component.preliminaryFormPaths = ["resources/aflac/NY-16800.pdf"];
            component.cartIds = [74];
            component.memberId$ = of(7);
            component.mpGroup = 86886;
            const spy1 = jest.spyOn(mockNgrxStore, "dispatch");
            const spy2 = jest.spyOn(mockNgrxStore, "onAsyncValue").mockReturnValue(of({} as HttpResponse<unknown>));
            const spy3 = jest.spyOn(component, "routeToAppFlow");
            component.emailPreliminaryForms("abcd123@gmail.com");
            expect(spy1).toBeCalledWith(
                EnrollmentsActions.emailPreliminaryForm({
                    memberId: 7,
                    email: "abcd123@gmail.com",
                    mpGroupId: component.mpGroup,
                    preliminaryForms: [{ preliminaryFormPath: "resources/aflac/NY-16800.pdf", cartItemId: 74 }],
                }),
            );
            expect(spy2).toBeCalled();
            expect(component.loadSpinner).toBe(false);
            expect(spy3).toBeCalled();
        });
    });

    describe("onPreliminaryOptionChange()", () => {
        it("should reset differentEmail form control", () => {
            component.preliminaryFormControl.setValue("paperCopy");
            component.onPreliminaryOptionChange();
            expect(component.differentEmail.value).toBeNull();
        });
    });

    describe("viewPreliminaryForm()", () => {
        it("should make downloadPreliminaryForm api call and use response to view pdf", () => {
            const spy = jest.spyOn(mockNgrxStore, "dispatch");
            component.preliminaryStatementPlans = ["Aflac Whole Life | 10 Year"];
            component.memberId$ = of(7);
            component.cartIds = [74];
            component.mpGroup = 86886;
            component.preliminaryFormPaths = ["resources/http/aflac/preliminaryForm.pdf"];
            component.viewPreliminaryForm("Aflac Whole Life | 10 Year", true);
            expect(spy).toBeCalledWith(
                EnrollmentsActions.downloadPreliminaryForm({
                    memberId: 7,
                    preliminaryFormPath: "resources/http/aflac/preliminaryForm.pdf",
                    cartItemId: 74,
                    mpGroupId: 86886,
                }),
            );
        });
    });

    describe("checkForRestrictedEmail()", () => {
        it("should set error if entered email is restricted", () => {
            component.differentEmail.setValue("noemail@aflac.com");
            component.restrictedEmailsConfig = ["abcd@aflac.com", "noemail@aflac.com"];
            component.checkForRestrictedEmail(component.differentEmail);
            expect(component.differentEmail.errors.restrictedEmail).toBe(true);
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
