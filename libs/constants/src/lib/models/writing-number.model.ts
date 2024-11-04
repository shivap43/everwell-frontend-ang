import { SITCode } from "./sit-code.model";

export interface WritingNumber {
    // eslint-disable-next-line id-denylist
    number: string;
    sitCodes: SITCode[];
}

export interface WritingNumberArray {
    writingNumbers: WritingNumber[];
}
