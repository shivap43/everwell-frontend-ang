import { SearchProducer } from "@empowered/api";

export class AddProducerList {
    static readonly type = "[ProducerList] add";

    constructor(private payload: SearchProducer) {}
}
