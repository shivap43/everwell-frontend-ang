import { NgModule } from "@angular/core";
import { MockDirective } from "@empowered/jest";

const MockMatPaginator = MockDirective("mat-paginator", {
    exportAs: "matPaginator",
    inputs: [
        "color",
        "disabled",
        "hidePageSize",
        "length",
        "pageIndex",
        "pageSize",
        "pageSizeOptions",
        "showFirstLastButtons",
    ],
    outputs: ["page"],
}) as any;

const MOCK_DECLARATIONS = [MockMatPaginator];

export const MockMatPaginatorModule: NgModule = (() => {
    const metadata: NgModule = {
        declarations: [MOCK_DECLARATIONS],
        exports: [MOCK_DECLARATIONS],
    };

    class Mock {}

    return NgModule(metadata)(Mock as any);
})();
