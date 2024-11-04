import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { NgxsModule } from "@ngxs/store";
import { CreateQuoteComponent } from "./create-quote.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { Component, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { of } from "rxjs";
import { provideMockStore } from "@ngrx/store/testing";
import { mockMatDialogData, mockMatDialogRef, mockStore } from "@empowered/testing";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatTableModule } from "@angular/material/table";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

@Pipe({
    name: "[date]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return String(value);
    }
}

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) => ({
        afterClosed: () => of(undefined),
    }),
} as MatDialog;

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return String(value);
    }
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner!: boolean;
}

describe("CreateQuoteComponent", () => {
    let component: CreateQuoteComponent;
    let fixture: ComponentFixture<CreateQuoteComponent>;
    let store: Store;
    let matdialogRef: MatDialogRef<CreateQuoteComponent>;
    let dialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CreateQuoteComponent,
                MockMonSpinnerComponent,
                MockTitleCasePipe,
                MockHasPermissionDirective,
                MockConfigEnableDirective,
                MockRichTooltipDirective,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                provideMockStore({}),
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: DatePipe, useClass: MockDatePipe },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: CurrencyPipe, useClass: MockCurrencyPipe },
                { provide: Store, useValue: mockStore },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                FormBuilder,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, MatTableModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateQuoteComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        matdialogRef = TestBed.inject(MatDialogRef);
        dialog = TestBed.inject(MatDialog);
    });

    describe("CreateQuoteComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("showLink()", () => {
        it("should return true if all allBrochureData has plan related BROCHURE", () => {
            component.allBrochureData = [{ planId: 1, brochure: ["a.pdf", "b.pdf"] }];
            const returnVal = component.showLink(1, "BROCHURE");
            expect(returnVal).toBe(true);
        });
        it("should return false if all allBrochureData doesn't have plan related BROCHURE", () => {
            component.allBrochureData = [{ planId: 2, brochure: ["a.pdf", "b.pdf"] }];
            const returnVal = component.showLink(1, "BROCHURE");
            expect(returnVal).toBe(false);
        });
        it("should return true if all allBrochureData has plan related VIDEO", () => {
            component.allBrochureData = [{ planId: 1, video: ["a.mp4", "b.mp4"] }];
            const returnVal = component.showLink(1, "VIDEO");
            expect(returnVal).toBe(true);
        });
        it("should return true if all allBrochureData doesn't have plan related VIDEO", () => {
            component.allBrochureData = [{ planId: 2, video: ["a.mp4", "b.mp4"] }];
            const returnVal = component.showLink(1, "VIDEO");
            expect(returnVal).toBe(false);
        });
    });

    describe("initializeQuoteForm()", () => {
        it("should set initializeQuoteForm", () => {
            component.initializeQuoteForm();
            expect(component.quoteForm).toBeDefined();
        });
    });

    describe("updateTitle", () => {
        it("should update title", () => {
            component.quoteForm = { value: { quoteName: "test" } } as FormGroup;
            component.updateTitle();
            expect(component.quoteTitle).toEqual("test");
        });
    });

    describe("closeForm()", () => {
        it("Should close the form when cancelled", () => {
            const spy = jest.spyOn(matdialogRef, "close");
            component.closeForm();
            expect(spy).toBeCalled();
        });
    });

    describe("isJuvenile", () => {
        it("should return true if Juvenile product id is passed", () => {
            expect(component.isJuvenile(65)).toBe(true);
        });

        it("should set false if not Juvenile product id is not passed", () => {
            expect(component.isJuvenile(28)).toBe(false);
        });
    });

    describe("isSTDSelected", () => {
        it("should return true if STD product id is passed", () => {
            expect(component.isSTDSelected(5)).toBe(true);
        });

        it("should set false if not STD product id is not passed", () => {
            expect(component.isSTDSelected(10)).toBe(false);
        });
    });

    describe("isLifeSelected", () => {
        it("should return true if Life product id is passed", () => {
            expect(component.isLifeSelected(28)).toBe(true);
        });

        it("should return true if Life product id is passed", () => {
            expect(component.isLifeSelected(29)).toBe(true);
        });

        it("should set false if not Life product id is not passed", () => {
            expect(component.isLifeSelected(30)).toBe(false);
        });
    });

    describe("getCurrentDate()", () => {
        it("should get the current time", () => {
            const date = new Date();
            component.getCurrentDate();
            expect(component.currentTime).toEqual(date);
        });
    });

    describe("formatDate()", () => {
        it("should format date", () => {
            const date = new Date();
            component.formatDate(date);
            expect(component.formatDate(date)).toEqual(date.toString());
        });
    });

    describe("openDialog()", () => {
        it("should open the dialog", () => {
            const spy = jest.spyOn(dialog, "open");
            component.openDialog();
            expect(spy).toBeCalled();
        });
    });

    describe("setBorderStyle()", () => {
        it("should return the border style based on the count 1", () => {
            expect(component.setBorderStyle(1)).toEqual("w-fit-content");
        });
        it("should return the border style based on the count 2", () => {
            expect(component.setBorderStyle(2)).toEqual("w35");
        });
        it("should return the border style based on the count 3", () => {
            expect(component.setBorderStyle(3)).toEqual("w45");
        });
    });

    describe("getQuoteSettingData()", () => {
        it("should get the quote level settings", () => {
            jest.spyOn(store, "selectSnapshot").mockReturnValue({ state: "GA" });
            component.getQuoteSettingData();
            expect(component.settings.state).toBe("GA");
        });
    });

    describe("isMultiplePrice()", () => {
        it("should return true if multiple price selected", () => {
            const item = { tag: "rider", riderTableData: [{ 2000: 1 }] };
            const response = component.isMultiplePrice(1, item);
            expect(response).toBeTruthy();
        });
    });

    describe("objectKeys()", () => {
        it("should return the keys of given object", () => {
            const object = { 2000: 1 };
            const response = component.objectKeys(object);
            expect(response[0]).toBe("2000");
        });
    });

    describe("openLink()", () => {
        it("should open brochure if all allBrochureData has plan related BROCHURE", () => {
            component.allBrochureData = [{ planId: 1, brochure: [{ location: "a.pdf" }, { location: "b.pdf" }] }];
            window.open = jest.fn();
            const spy = jest.spyOn(window, "open").mockImplementation(() => undefined);
            component.openLink(1, "BROCHURE");
            expect(spy).toBeCalledWith("a.pdf", "_blank");
        });
        it("should open video if all allBrochureData has plan related VIDEO", () => {
            component.allBrochureData = [{ planId: 1, video: [{ location: "a.mp4" }, { location: "b.mp4" }] }];
            window.open = jest.fn();
            const spy = jest.spyOn(window, "open").mockImplementation(() => undefined);
            component.openLink(1, "VIDEO");
            expect(spy).toBeCalledWith("a.mp4", "_blank");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
            const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(nextSpy).toHaveBeenCalledTimes(1);
            expect(completeSpy).toHaveBeenCalledTimes(1);
        });
    });
});
