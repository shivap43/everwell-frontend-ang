import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { LanguageModel, MemberService } from "@empowered/api";
import { ClientErrorResponseCode, DependentAddressUpdateModalLanguage, MemberDependent } from "@empowered/constants";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { AccountListState } from "@empowered/ngxs-store";
import { mockLanguageService, mockMatDialogRef, mockMemberService } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { Observable, of, throwError } from "rxjs";
import { TestScheduler } from "rxjs/testing";
import { DependentAddressUpdateModalComponent } from "./dependent-address-update-modal.component";

const mockMatDialogData = {
    memberId: 1,
    memberAddress: {
        address1: "123 ABC ST",
        address2: "APT#23",
        city: "CHARLOTTE",
        state: "NC",
        zip: "28978",
    },
};

const error = {};
error["error"] = {
    status: 400,
    code: "badParameter",
    ["details"]: [{ code: "", field: "MockField", message: "Mock 404 error" }],
};

describe("DependentAddressUpdateModalComponent", () => {
    let component: DependentAddressUpdateModalComponent;
    let fixture: ComponentFixture<DependentAddressUpdateModalComponent>;
    let matDialogRef: MatDialogRef<DependentAddressUpdateModalComponent>;
    let memberService: MemberService;
    let fb: FormBuilder;
    let replaceTagPipe: ReplaceTagPipe;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DependentAddressUpdateModalComponent, ReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                ReplaceTagPipe,
                FormBuilder,
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([AccountListState])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DependentAddressUpdateModalComponent);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        memberService = TestBed.inject(MemberService);
        replaceTagPipe = TestBed.inject(ReplaceTagPipe);
        fb = TestBed.inject(FormBuilder);
        store = TestBed.inject(Store);

        component.addressUpdateModalForm = fb.group({
            dependents: ["1"],
        });

        store.reset({
            ...store.snapshot(),
            core: {
                regex: { EMAIL: "SAMPLE_REGEX" },
            },
        });

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        let mpGroup$: Observable<number>;

        beforeEach(() => {
            mpGroup$ = of(1);
            jest.spyOn(component, "getMemberDependents");
            jest.spyOn(component.mpGroup$, "pipe").mockReturnValue(mpGroup$);
            component.ngOnInit();
        });

        it("should set addressUpdateModalForm", () => {
            expect(component.addressUpdateModalForm).toBeTruthy();
        });

        it("should call getMemberDependents", () => {
            expect(component.getMemberDependents).toBeCalledTimes(1);
        });

        it("should set mpGroup", () => {
            mpGroup$.subscribe((x) => {
                expect(component.mpGroup).toBe(x);
            });
        });
    });

    describe("checkDependentSelection", () => {
        describe("When dependent is checked", () => {
            beforeEach(() => {
                component.selectedDependentIds = [];
                component.checkDependentSelection({ source: { value: "1" }, checked: true } as never);
            });

            it("should add dependent to selectedDependentIds", () => {
                expect(component.selectedDependentIds).toEqual(["1"]);
            });
        });

        describe("When dependent is unchecked", () => {
            beforeEach(() => {
                component.selectedDependentIds = ["1"];
                component.checkDependentSelection({ source: { value: "1" }, checked: false } as never);
            });

            it("should remove dependent from selectedDependentIds", () => {
                expect(component.selectedDependentIds).toEqual([]);
            });
        });
    });

    describe("getMemberDependents", () => {
        let mpGroup$: Observable<number>;

        beforeEach(() => {
            component.dependentList = [];
        });

        describe("When getMemberDependents returns an error", () => {
            let transformSpy: jest.SpyInstance;
            let languageList: LanguageModel[];

            beforeEach(async () => {
                languageList = [
                    {
                        tagName: "primary.portal.dependent.address.apiError",
                        value: "Value for ##mpgroup## ##memberid##",
                    } as never,
                ];

                mpGroup$ = of(2);
                transformSpy = jest.spyOn(replaceTagPipe, "transform");
                jest.spyOn(component.mpGroup$, "pipe").mockReturnValue(mpGroup$);
                jest.spyOn(memberService, "getMemberDependents").mockReturnValue(throwError(error));
                jest.spyOn(store, "selectSnapshot").mockReturnValue(languageList);

                component.mpGroup = 2;
                component.getMemberDependents(1, 3);
                fixture.detectChanges();
                await fixture.whenStable();
            });

            it("should call replaceTagPipe.transform", () => {
                expect(transformSpy).toBeCalledTimes(1);
            });

            it("should set apiError, set isLoading to false, and call replaceTagPipe.transform with correct parameters", () => {
                expect(component.apiError).toEqual("Value for 2 1");
                expect(component.isLoading).toBeFalsy();
                expect(transformSpy).toBeCalledWith(DependentAddressUpdateModalLanguage.DEPENDENT_FETCH_ERROR, {
                    "##mpgroup##": "2",
                    "##memberid##": "1",
                });
            });
        });

        describe("When getMemberDependents returns a list of dependents", () => {
            beforeEach(() => {
                jest.spyOn(memberService, "getMemberDependents").mockReturnValue(
                    of([
                        { id: 1, name: { firstName: "FST", lastName: "NAME" } },
                        { id: 2, name: { firstName: "LST", lastName: "NAME" } },
                    ]) as unknown as Observable<MemberDependent[]>,
                );
                component.getMemberDependents(1, 1);
            });

            it("should set dependentList", () => {
                expect(component.dependentList.length).toBe(2);
            });

            it("should set isLoading to false", () => {
                expect(component.isLoading).toBeFalsy();
            });
        });

        describe("When getMemberDependents returns an empty list", () => {
            beforeEach(() => {
                jest.spyOn(memberService, "getMemberDependents").mockReturnValue(of([]));
                component.getMemberDependents(1, 1);
            });

            it("should set dependentList", () => {
                expect(component.dependentList.length).toBe(0);
            });

            it("should set isLoading to false", () => {
                expect(component.isLoading).toBeFalsy();
            });
        });

        describe("When getMemberDependents returns falsy", () => {
            beforeEach(() => {
                jest.spyOn(memberService, "getMemberDependents").mockReturnValue(of(undefined));
                component.getMemberDependents(1, 1);
            });

            it("should not set dependentList", () => {
                fixture.whenStable().then(() => expect(component.dependentList.length).toBe(0));
            });

            it("should set isLoading to false", () => {
                fixture.whenStable().then(() => expect(component.isLoading).toBeFalsy());
            });
        });
    });

    describe("showErrorAlertMessage", () => {
        let fetchSecondaryLanguageValueSpy: jest.SpyInstance;

        beforeEach(() => {
            fetchSecondaryLanguageValueSpy = jest
                .spyOn(component["languageService"], "fetchSecondaryLanguageValue")
                .mockReturnValue("Mock 404 error");
            component.apiError = "";
        });

        afterEach(() => {
            fetchSecondaryLanguageValueSpy.mockClear();
        });

        describe("When error status is 400 and there are details", () => {
            beforeEach(() => {
                component.showErrorAlertMessage({
                    error: {
                        ...error,
                        status: ClientErrorResponseCode.RESP_400,
                        code: "badParameter",
                    },
                } as never);
            });

            it("should set apiError to 'secondary.portal.members.api.400.badParameter.MockField'", () => {
                expect(fetchSecondaryLanguageValueSpy).toBeCalledWith("secondary.api.400.badParameter");
                expect(component.apiError).toEqual("Mock 404 error");
            });
        });

        describe("When error status is 400 and there are no details", () => {
            beforeEach(() => {
                component.showErrorAlertMessage({
                    error: {
                        ...error,
                        status: ClientErrorResponseCode.RESP_400,
                        code: "badParameter",
                        ["details"]: [],
                    },
                } as never);
            });

            it("should set apiError to 'secondary.api.400.badParameter'", () => {
                expect(fetchSecondaryLanguageValueSpy).toBeCalledWith("secondary.api.400.badParameter");
                expect(component.apiError).toEqual("Mock 404 error");
            });
        });

        describe("When error status is not 400", () => {
            beforeEach(() => {
                component.showErrorAlertMessage({
                    error: {
                        ...error,
                        status: ClientErrorResponseCode.RESP_401,
                        code: "badParameter",
                    },
                } as never);
            });

            it("should set apiError to 'secondary.portal.members.api.401.badParameter.MockField'", () => {
                expect(fetchSecondaryLanguageValueSpy).toBeCalledWith("secondary.api.401.badParameter");
                expect(component.apiError).toEqual("Mock 404 error");
            });
        });
    });

    describe("closePopup()", () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(matDialogRef, "close");
            component.closePopup();
        });

        it("should call close()", () => {
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        let spy1: jest.SpyInstance;
        let spy2: jest.SpyInstance;

        beforeEach(() => {
            spy1 = jest.spyOn(component["unsubscribe$"], "next");
            spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
        });
        it("should clean up subscriptions", () => {
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("updateDependantAddress", () => {
        let spy: jest.SpyInstance;
        let testScheduler: TestScheduler;

        beforeEach(() => {
            testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
            });
        });

        describe("When no dependents are selected", () => {
            beforeEach(() => {
                testScheduler.run((helpers) => {
                    spy = jest.spyOn(memberService, "saveDependentContact").mockReturnValue(helpers.cold("-a|", { a: {} }) as never);
                    component.selectedDependentIds = [];
                });
            });

            it("should not call saveDependentContact", () => {
                testScheduler.run((helpers) => {
                    component.updateDependantAddress();
                    expect(spy.mock?.results?.[0]?.value).toBeUndefined();
                    expect(spy).not.toBeCalled();
                });
            });

            it("should invalidate the form", () => {
                testScheduler.run(() => {
                    component.updateDependantAddress();
                    expect(component.addressUpdateModalForm.invalid).toBeTruthy();
                });
            });
        });

        describe("When dependents are selected", () => {
            beforeEach(() =>
                testScheduler.run((helpers) => {
                    spy = jest.spyOn(memberService, "saveDependentContact").mockReturnValue(helpers.cold("-a|", { a: {} }) as never);
                    component.selectedDependentIds = ["1"];
                }),
            );

            it("should call saveDependentContact", () => {
                testScheduler.run((helpers) => {
                    component.updateDependantAddress();
                    helpers.expectObservable(spy.mock.results[0].value).toBe("-a|", { a: {} });
                    expect(spy).toBeCalledTimes(1);
                });
            });

            it("should validate the form", () => {
                testScheduler.run(() => {
                    component.updateDependantAddress();
                    expect(component.addressUpdateModalForm.valid).toBeTruthy();
                });
            });
        });

        xdescribe("When saveDependentContact fails", () => {
            let languageSpy: jest.SpyInstance;

            beforeEach(() => {
                testScheduler.run((helpers) => {});
            });

            it("should set isLoading to false, set the error message correctly, and get the error message associated with secondary.portal.updateDependent.api.error", () => {
                testScheduler.run(() => {
                    component.dependentList = [
                        { id: 1, name: { firstName: "FST", lastName: "NAME" }, state: "NC", birthDate: "01/01/2000", gender: "M" },
                    ];
                    component.selectedDependentIds = ["1"];
                    languageSpy = jest.spyOn(mockLanguageService, "fetchSecondaryLanguageValue").mockReturnValue("Mock 404 error");
                    jest.spyOn(memberService, "saveDependentContact").mockReturnValue(throwError(error));

                    component.updateDependantAddress();

                    expect(component.apiError).toEqual("Mock 404 error");
                    expect(component.isLoading).toBeFalsy();
                    expect(languageSpy).toHaveBeenCalledWith("secondary.portal.updateDependent.api.error");
                });
            });
        });
    });
});
