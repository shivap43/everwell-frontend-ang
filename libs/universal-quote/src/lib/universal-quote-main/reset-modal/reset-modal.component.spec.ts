import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { SetQuoteLevelSetting } from "@empowered/ngxs-store";
import { mockLanguageService } from "@empowered/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { UniversalService } from "../universal.service";
import { ResetModalComponent } from "./reset-modal.component";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<ResetModalComponent>;

describe("ResetModalComponent", () => {
    let component: ResetModalComponent;
    let fixture: ComponentFixture<ResetModalComponent>;
    let mockDialog: MatDialogRef<ResetModalComponent>;
    let languageService: LanguageService;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ResetModalComponent],
            providers: [
                provideMockStore({}),
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialogRef, useValue: mockMatDialog },
                { provide: UniversalService, useValue: {} },
            ],
            imports: [NgxsModule.forRoot()],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ResetModalComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call getLanguageString() method", () => {
            const spy = jest.spyOn(component, "getLanguageString");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("resetSetting()", () => {
        it("should dispatch SetQuoteLevelSetting action", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.resetSetting();
            expect(spy).toBeCalledWith(new SetQuoteLevelSetting({}, true));
        });

        it("should reset the ResetModalComponent dialog", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.resetSetting();
            expect(spy).toBeCalledWith({ action: "reset" });
        });
    });

    describe("closeForm()", () => {
        it("should close the ResetModalComponent dialog", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.closeForm();
            expect(spy).toBeCalledWith({ action: "cancel" });
        });
    });

    describe("getLanguageString", () => {
        it("should get the languageStrings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.getLanguageString();
            expect(spy).toBeCalledTimes(1);
        });
    });
});
