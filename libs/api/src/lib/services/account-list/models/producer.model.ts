import { ROLE } from "@empowered/constants";

export interface Producer {
    id?: number;
    firstName: string;
    lastName: string;
    writingNumbers: string[];
    primary: boolean;
    accountProducerRole?: ROLE;
}
