import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { License, ProducerService, SearchProducer } from "@empowered/api";
import { Name } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { SetSearchedProducer, AddProducerList, ProducerListState } from "@empowered/ngxs-store";
import {
    MockReplaceTagPipe,
    mockDatePipe,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockProducerService,
    mockRouter,
    mockUserService,
} from "@empowered/testing";
import { UserService } from "@empowered/user";
import { NgxsModule, Store } from "@ngxs/store";
import { SearchProducerComponent } from "./search-producer.component";
import { MaterialModule } from "../../material/material.module";
import { MatMenuModule } from "@angular/material/menu";
import { Subscription } from "rxjs";
import { StoreModule } from "@ngrx/store";

const navlinks = [
    { label: "", id: 1, type: "SEARCH" },
    { label: "", id: 2, type: "RECENT" },
];
const loggedInProducer = {
    id: 111,
    name: {
        firstName: "Steve",
        lastName: "Smith",
    },
    licenses: [],
};

describe("SearchProducerComponent", () => {
    let component: SearchProducerComponent;
    let fixture: ComponentFixture<SearchProducerComponent>;
    let producerService: ProducerService;
    let store: Store;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([ProducerListState]), RouterTestingModule, MaterialModule, MatMenuModule, StoreModule.forRoot({})],
            declarations: [SearchProducerComponent, MockReplaceTagPipe],
            providers: [
                FormBuilder,
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {},
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: ProducerService,
                    useClass: mockProducerService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(SearchProducerComponent);
        component = fixture.componentInstance;
        producerService = TestBed.inject(ProducerService);
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            producers: {
                producerList: [
                    {
                        id: 1,
                        name: {
                            firstName: "Jefreyy",
                            lastName: "Anderson",
                        } as Name,
                    },
                ] as SearchProducer[],
            },
        });
        component.searchProducerForm = new FormGroup({
            searchType: new FormControl([]),
            producerData: new FormGroup({
                serachProd: new FormControl("Steve"),
            }),
        });
        component.pageSize = 10;
        component.pageNumber = 1;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("setLoggedInUserInRecentSearch()", () => {
        it("should call producerSearch and dispatch action", () => {
            component.hasRoleTwentyDirectPermission = true;
            const spy1 = jest.spyOn(producerService, "producerSearch");
            const spy2 = jest.spyOn(store, "dispatch");
            component.setLoggedInUserInRecentSearch();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith(
                new AddProducerList({
                    ...loggedInProducer,
                    fullName: "Smith, Steve",
                    intersectedState: [],
                } as SearchProducer),
            );
        });
    });
    describe("reloadData()", () => {
        it("should reset data and initialize form", () => {
            component.reloadData();
            expect(component.producersList).toStrictEqual([]);
            expect(component.searchProducerForm).toBeDefined();
            expect(component.navLinks).toStrictEqual(navlinks);
        });
    });
    describe("showTab()", () => {
        beforeEach(() => {
            component.navLinks = navlinks;
        });
        it("should set data source when id is 0 and based on form value", () => {
            const id = { index: 0 } as MatTabChangeEvent;
            component.producersList = [{ ...loggedInProducer }] as SearchProducer[];
            component.showTab(id);
            expect(component.type).toStrictEqual("SEARCH");
            expect(component.dataSource).toBeDefined();
            expect(component.data).toStrictEqual([{ ...loggedInProducer }] as SearchProducer[]);
        });
        it("should set data source as undefined when serachProd is empty", () => {
            const id = { index: 0 } as MatTabChangeEvent;
            const producerDataFormGroup: FormGroup = component.searchProducerForm.controls.producerData as FormGroup;
            producerDataFormGroup.controls.serachProd?.setValue("");
            component.showTab(id);
            expect(component.dataSource).toBeUndefined();
        });
        it("should fetch recent producers when id is 1", () => {
            const id = { index: 1 } as MatTabChangeEvent;
            component.showTab(id);
            expect(component.type).toStrictEqual("RECENT");
            expect(component.recentProducersList).toStrictEqual([
                {
                    id: 1,
                    name: {
                        firstName: "Jefreyy",
                        lastName: "Anderson",
                    } as Name,
                },
            ]);
        });
    });
    describe("onCancelClick()", () => {
        it("should close the dialog and reset data", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy1).toBeCalled();
            expect(component.producersList).toStrictEqual([]);
        });
    });
    describe("initializeSearchForm()", () => {
        beforeAll(() => {
            jest.clearAllMocks();
        });
        it("should define searchProducerForm and set value for searchType", () => {
            component.initializeSearchForm();
            expect(component.searchProducerForm).toBeDefined();
            expect(component.searchProducerForm.controls.searchType.value).toStrictEqual("byProducer");
        });
    });
    describe("fetchRecentProducers()", () => {
        it("should fetch recentProducersList from store", () => {
            component.fetchRecentProducers();
            expect(component.recentProducersList).toStrictEqual([
                {
                    id: 1,
                    name: {
                        firstName: "Jefreyy",
                        lastName: "Anderson",
                    } as Name,
                },
            ]);
        });
        it("should set recent 10 producers to recentProducersList if the list is greater than 10", () => {
            store.reset({
                ...store.snapshot(),
                producers: {
                    producerList: [
                        { id: 1 },
                        { id: 2 },
                        { id: 3 },
                        { id: 4 },
                        { id: 5 },
                        { id: 6 },
                        { id: 7 },
                        { id: 8 },
                        { id: 9 },
                        { id: 10 },
                        { id: 11 },
                        { id: 12 },
                    ] as SearchProducer[],
                },
            });
            component.fetchRecentProducers();
            expect(component.recentProducersList).toStrictEqual([
                { id: 12 },
                { id: 11 },
                { id: 10 },
                { id: 9 },
                { id: 8 },
                { id: 7 },
                { id: 6 },
                { id: 5 },
                { id: 4 },
                { id: 3 },
            ]);
        });
    });
    describe("getQueryParamString()", () => {
        it("should return Params", () => {
            const producerDataFormGroup: FormGroup = component.searchProducerForm.controls.producerData as FormGroup;
            producerDataFormGroup.controls.serachProd?.setValue("steve");
            const params1 = component.getQueryParamString();
            expect(params1).toStrictEqual({
                size: 10,
                page: 1,
                search: "steve",
            });
            producerDataFormGroup.controls.serachProd?.setValue("");
            const params2 = component.getQueryParamString();
            expect(params2).toStrictEqual({
                size: 10,
                page: 1,
            });
        });
    });
    describe("getProducerExInfo()", () => {
        const searchProducer = {
            id: 1,
            name: {
                firstName: "Jefreyy",
                lastName: "Anderson",
            } as Name,
            licenses: [{ state: { abbreviation: "GA" } }] as License[],
        } as SearchProducer;
        it("should return producer with fullName and intersectedState", () => {
            const producer = component.getProducerExInfo(searchProducer);
            expect(producer).toStrictEqual({
                id: 1,
                name: {
                    firstName: "Jefreyy",
                    lastName: "Anderson",
                },
                fullName: "Anderson, Jefreyy",
                licenses: [{ state: { abbreviation: "GA" } }],
                intersectedState: [{ state: { abbreviation: "GA" } }],
            });
        });
    });
    describe("getNoDataOnFilterErrorMessage()", () => {
        it("should return no result message", () => {
            component.step = 0;
            const result1 = component.getNoDataOnFilterErrorMessage();
            expect(result1).toStrictEqual("primary.portal.search.producer.noResult");
            component.step = 1;
            const result2 = component.getNoDataOnFilterErrorMessage();
            expect(result2).toStrictEqual("primary.portal.search.producer.noResultText");
        });
    });
    describe("setLanguageStrings()", () => {
        it("should set language values", () => {
            component.setLanguageStrings();
            expect(component.SEARCH_PRODUCER).toStrictEqual("primary.portal.commission.producer.single.tab.search");
            expect(component.RECENT_PRODUCER).toStrictEqual("primary.portal.commission.producer.single.tab.recent");
        });
    });
    describe("showErrorAlertMessage()", () => {
        it("should set errorMessage when the api error status is 400", () => {
            let error = {
                name: "api error name",
                message: "api error message",
                error: { status: 400, message: "error message" },
            } as Error;
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toStrictEqual("error message");
            error = {
                name: "api error name",
                message: "api error message",
                error: { status: 400, code: "badRequest" },
            } as Error;
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toStrictEqual("primary.portal.search.producer.noResult");
        });
        it("should set errorMessage based on api error status and error code when the error status is other than 400", () => {
            const error = {
                name: "api error name",
                message: "api error message",
                error: { status: 500, code: "generic" },
            } as Error;
            component.showErrorAlertMessage(error);
            expect(component.errorMessage).toStrictEqual("secondary.api.500.generic");
        });
    });
    describe("goToDirect()", () => {
        it("should dispatch an action and close dialog fi serachType is byProducer", () => {
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component["dialogRef"], "close");
            component.goToDirect({} as SearchProducer, "byProducer");
            expect(spy1).toBeCalledWith(new AddProducerList({} as SearchProducer));
            expect(spy2).toBeCalledWith({ producerData: {}, searchType: "byProducer" });
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriber = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
