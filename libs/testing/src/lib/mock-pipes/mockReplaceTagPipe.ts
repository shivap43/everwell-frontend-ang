import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "replaceTag",
})
export class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "replaced";
    }
}
