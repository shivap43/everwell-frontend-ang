import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { ComponentType } from "@angular/cdk/portal";
import { VoidCoverageComponent } from "./void-coverage.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MaterialModule } from "@empowered/ui";

@Component({
    selector: "empowered-mon-spinner",
    template: "",
})
class MockMonSpinnerComponent {
    @Input() backdrop = false;
    @Input() enableSpinner = false;
}
const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
} as LanguageService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () =>
                of({
                    mpGroup: 98654,
                }),
        } as MatDialogRef<any>),
} as MatDialog;

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "replaced";
    }
}

@Component({
    selector: "empowered-modal",
    template: "",
})
class MockModalComponent {}

@Component({
    selector: "empowered-modal-header",
    template: "",
})
class MockModalHeaderComponent {}

@Component({
    selector: "empowered-modal-footer",
    template: "",
})
class MockModalFooterComponent {}

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

describe("VoidCoverageComponent", () => {
    let component: VoidCoverageComponent;
    let fixture: ComponentFixture<VoidCoverageComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, FormsModule, ReactiveFormsModule, MaterialModule],
            declarations: [
                VoidCoverageComponent,
                MockMonSpinnerComponent,
                MockModalComponent,
                MockModalHeaderComponent,
                MockReplaceTagPipe,
                MockModalFooterComponent,
                MockHasPermissionDirective,
                MockConfigEnableDirective,
            ],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: { mpGroup: 976542 },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(VoidCoverageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("VoidCoverageComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("setVoidRequest()", () => {
        it("should call void request method having reason and comment with disabled", () => {
            component.isVoidReasonEnabled = false;
            component.setVoidRequest();
            expect(component.voidCoverageRequest.reason).toBe(undefined);
            expect(component.voidCoverageRequest.comment).toBe(undefined);
        });
        it("should call void request method", () => {
            component.voidCoverageForm.get("voidReasons").setValue("coverage_ended");
            component.voidCoverageForm.get("notes").setValue("need to be renewed");
            component.isVoidReasonEnabled = true;
            component.isVoidCommentEnabled = true;
            component.setVoidRequest();
            expect(component.voidCoverageRequest.reason).toBe("coverage_ended");
            expect(component.voidCoverageRequest.comment).toBe("need to be renewed");
        });
    });

    describe("setReasonsValue()", () => {
        it("should call setReasonsValue method", () => {
            component.voidCoverageReasons = ["coverage_expired"];
            component.setReasonsValue({ value: "coverage_expired" });
            expect(component.voidCoverageForm.get("voidReasons").value).toBe("coverage_expired");
        });
    });
    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
