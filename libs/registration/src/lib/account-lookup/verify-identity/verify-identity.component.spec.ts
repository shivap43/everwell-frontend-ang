import { VerifyIdentityComponent } from "./verify-identity.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router, Params } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { MockConfigEnableDirective, mockAuthenticationService, mockLanguageService, mockStore } from "@empowered/testing";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AuthenticationService } from "@empowered/api";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

const mockRouter = {
    url: "some route",
};

const mockRouteParams = new BehaviorSubject<Params>({ id: "" });

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

describe("VerifyIdentityComponent", () => {
    let component: VerifyIdentityComponent;
    let fixture: ComponentFixture<VerifyIdentityComponent>;
    let store: Store;
    let authenticationService: AuthenticationService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
            providers: [
                FormBuilder,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                { provide: AuthenticationService, useValue: mockAuthenticationService },
            ],
            declarations: [VerifyIdentityComponent, MockConfigEnableDirective],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VerifyIdentityComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        authenticationService = TestBed.inject(AuthenticationService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("updateSelection()", () => {
        it("should set error to false when selection is updated", () => {
            component.updateSelection();
            expect(component.error).toBe(false);
        });
    });

    describe("onSubmit()", () => {
        it("should set the error if form is not valid", () => {
            component.ngOnInit();
            component.onSubmit();
            expect(component.error).toBe(true);
        });
    });

    describe("setcommunicationMode()", () => {
        it("should set communicationModeNotSet to false", () => {
            component.setcommunicationMode();
            expect(component.communicationModeNotSet).toBe(false);
        });
    });
});
