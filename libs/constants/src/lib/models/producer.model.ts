import { Name } from "./name.model";
import { WritingNumber } from "./writing-number.model";

export interface ProducerDetails {
    id: number;
    type: string;
    name: Name;
    emailAddress: string;
    phoneNumber: string;
    reportsToId: number;
    // eslint-disable-next-line @typescript-eslint/ban-types
    reportTo: object;
    title: string;
    npn: string;
    writingNumbers: WritingNumber[];
    brokerageId: number;
    fullName?: string;
    writingNum?: string[];
}
