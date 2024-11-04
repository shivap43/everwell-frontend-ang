import { Pipe, PipeTransform } from "@angular/core";
import { TargetUnit, TargetUnitType, ProducerSearch } from "@empowered/api";
import { Observable, defer, of, NEVER } from "rxjs";
import { MessageCenterFacadeService } from "../services/message-center-facade.service";
import { map } from "rxjs/operators";
import { TitleCasePipe } from "@angular/common";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage, MemberListItem, Admin } from "@empowered/constants";

const MULTIPLE_RECIPIENTS_ESCAPE_SEQUENCE = "XX";

@Pipe({
    name: "dereferenceTargetUnit",
})
export class DereferenceTargetUnitPipe implements PipeTransform {
    constructor(
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly titlePipe: TitleCasePipe,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Dereferences the target unit into a comma delimited list of the serialized name
     *
     * @param unit the unit to dereference
     * @returns the formatted, dereferenced data depending on the unit type
     */
    transform(unit: TargetUnit): Observable<string> | Observable<never> {
        return defer(() => {
            if (unit.ids.length > 1) {
                return of(
                    this.languageService
                        .fetchPrimaryLanguageValue(MessageCenterLanguage.TARGET_UNIT_PIPE_MULTIPLE)
                        .replace(MULTIPLE_RECIPIENTS_ESCAPE_SEQUENCE, `${unit.ids.length}`),
                );
            }

            switch (unit.type) {
                case TargetUnitType.ADMIN:
                    return this.messageCenterFacade.getAdmins().pipe(
                        map((admins) => admins.filter((admin) => unit.ids.indexOf(admin.id) !== -1)),
                        map((admins) => this.adminReducer(admins)),
                    );
                case TargetUnitType.CATEGORY:
                    return this.messageCenterFacade
                        .getCategories()
                        .pipe(
                            map((categories) =>
                                categories
                                    .filter((category) => unit.ids.indexOf(category.id) !== -1)
                                    .reduce(
                                        (accumulator, category) =>
                                            accumulator === "" ? category.name : `${accumulator}, ${category.name}`,
                                        "",
                                    ),
                            ),
                        );
                case TargetUnitType.MEMBER:
                    return this.messageCenterFacade.getMembers().pipe(
                        map((members) => members.filter((member) => unit.ids.indexOf(member.id) !== -1)),
                        map((members) => this.memberReducer(members)),
                    );
                case TargetUnitType.PRODUCER:
                    return this.messageCenterFacade.getProducers().pipe(
                        map((producers) => producers.filter((producer) => unit.ids.indexOf(producer.id) !== -1)),
                        map((producers) => this.producerReducer(producers)),
                    );
                case TargetUnitType.AUDIENCE:
                    return of("NOT YET IMPLEMENTED");
                default:
                    return NEVER;
            }
        });
    }

    /**
     * Converts the admins into a single string
     *
     * @param admins list of admins to convert
     * @returns string representation of the list
     */
    private adminReducer(admins: Admin[]): string {
        return admins.reduce(
            (accumulator, currentAdmin) =>
                accumulator === "" ? this.serializeAdminName(currentAdmin) : `${accumulator}, ${this.serializeAdminName(currentAdmin)}`,
            "",
        );
    }

    /**
     * Converts the admin into a string
     *
     * @param admin admin to convert
     * @returns string representation of the admin
     */
    private serializeAdminName(admin: Admin): string {
        return `${this.titlePipe.transform(admin.name.firstName)} ${this.titlePipe.transform(admin.name.lastName)}`;
    }

    /**
     * Convert a list of members to a single string
     *
     * @param members List of members to convert
     * @returns string representation of the list
     */
    private memberReducer(members: MemberListItem[]): string {
        return members.reduce(
            (accumulator, currentMember) =>
                accumulator === "" ? this.serializeMemberName(currentMember) : `${accumulator}, ${this.serializeMemberName(currentMember)}`,
            "",
        );
    }

    /**
     * Convert the member to a string
     *
     * @param member member to convert
     * @returns string representation of the member
     */
    private serializeMemberName(member: MemberListItem): string {
        return `${member.firstName} ${member.lastName}`;
    }

    /**
     * Converts a list of producers into a single string
     *
     * @param producer list of producers to reduce
     * @returns the serilaized list of producers
     */
    private producerReducer(producers: ProducerSearch[]): string {
        return producers.reduce(
            (accumulator, currentProducer) =>
                accumulator === ""
                    ? this.serializeProducerName(currentProducer)
                    : `${accumulator}, ${this.serializeProducerName(currentProducer)}`,
            "",
        );
    }

    /**
     * Converts a single producer into a string
     *
     * @param producer the producer to convert
     * @returns the converted string
     */
    private serializeProducerName(producer: ProducerSearch): string {
        return `${producer.name.firstName} ${producer.name.lastName}`;
    }
}
