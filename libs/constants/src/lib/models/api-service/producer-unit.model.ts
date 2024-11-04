import { Name } from "../name.model";

export interface ProducerUnit {
    producerId: number;
    readonly name: string;
    readonly fullName: Name;
}
