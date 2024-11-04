import { ProducerInformation } from "@empowered/api";
import { of } from "rxjs";

export class mockProducerService {
    getProducerInformation(producerId: string) {
        return of({ licenses: [], carrierAppointments: [] } as ProducerInformation);
    }
    producerSearch(searchParams: any) {
        return of({
            content: [
                {
                    id: 111,
                    name: {
                        firstName: "Steve",
                        lastName: "Smith",
                    },
                    licenses: [],
                },
                {
                    id: 333,
                    name: {
                        firstName: "Johny",
                        lastName: "Bairstow",
                    },
                },
            ],
        });
    }
}
