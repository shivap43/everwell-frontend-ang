import { PipeTransform, Pipe } from "@angular/core";

@Pipe({ name: "replaceTag" })
export class ReplaceMockPipe implements PipeTransform {
    transform(param: string, obj: any): any {
        return "mocking";
    }
}
