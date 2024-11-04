import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, Pipe, PipeTransform } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngrx/store";
import { ScreenHandOffComponent } from "./screen-hand-off.component";
import { MemberService } from "@empowered/api";
import { EmpoweredModalService } from "@empowered/common-services";

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchPrimaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const data = {
    user: {
        id: 1,
        cusername: "username",
        name: "name",
        partnerId: 1,
        consented: false,
        memberId: 1,
        groupId: 111,
        modal: true,
        producerId: 1234,
    },
    modal: true,
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<any>;

describe("ScreenHandOffComponent", () => {
    let component: ScreenHandOffComponent;
    let fixture: ComponentFixture<ScreenHandOffComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScreenHandOffComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                MemberService,
                EmpoweredModalService,
                Store,
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ScreenHandOffComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closeDialog()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeDialog(false);
            expect(spy1).toBeCalledWith(false);
        });
    });
});
