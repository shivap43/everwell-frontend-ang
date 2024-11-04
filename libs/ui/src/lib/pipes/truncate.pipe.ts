import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "truncate",
})
// Truncates a string to the given limit, applying an '...' to the removed content
export class TruncatePipe implements PipeTransform {
    static readonly MAX_CHARS = 30;

    transform(value: string, characterLimit?: number): string {
        if (!characterLimit) {
            characterLimit = TruncatePipe.MAX_CHARS;
        }

        if (value.length <= characterLimit) {
            return value;
        }

        const keepCount = characterLimit / 2;
        const evenSplit = keepCount % 1 === 0;
        const lowerLimit = evenSplit ? keepCount - 1 : keepCount - 1.5;
        // account for the index
        const upperLimit = evenSplit ? keepCount - 3 : keepCount - 2.5;

        return value.substr(0, lowerLimit) + "..." + value.substr(value.length - upperLimit);
    }
}
