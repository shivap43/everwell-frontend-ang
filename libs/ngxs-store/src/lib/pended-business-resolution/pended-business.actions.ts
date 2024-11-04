/* eslint-disable max-classes-per-file */

import { ProducerDetails } from "@empowered/constants";

export class SetAdmin {
    static readonly type = "[PendedBusinessState] Set Admin";
    constructor() {}
}

// eslint-disable-next-line max-classes-per-file
export class SetProducer {
    static readonly type = "[PendedBusinessState] Set Producer";
    constructor(public producer: ProducerDetails) {}
}
