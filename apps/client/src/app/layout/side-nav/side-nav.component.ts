import { SideNavNode, SideNavFlatNode } from "./models/side-nav-node.model";
import { FlatTreeControl } from "@angular/cdk/tree";
import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MatTreeFlatDataSource, MatTreeFlattener } from "@angular/material/tree";
import { SharedService } from "@empowered/common-services";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { ConfigName, Permission } from "@empowered/constants";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";

const LIFE_EVENT = "Life events";
const COMMISSION_ROUTE = "/member/commissions/";
const BUSINESS_ROUTE = "/member/business";
const COMMISSION_ICON_NAME = "percentage-arrow";
const BUSINESS_ICON_NAME = "file-dollar";

@Component({
    selector: "empowered-side-nav",
    templateUrl: "./side-nav.component.html",
    styleUrls: ["./side-nav.component.scss"],
})
export class SideNavComponent implements AfterViewInit, OnDestroy {
    @ViewChild("tree", { static: true }) tree;
    isAgentSelfEnrolled = false;
    lifeEvent = LIFE_EVENT;
    readonly POLICY_CHANGE_REQUEST = "Policy change requests";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.agent.selfEnrollment.commissions",
        "primary.portal.agent.selfEnrollment.placeholder",
        "primary.portal.agent.selfEnrollment.business",
    ]);

    readonly SIDE_NAV_MMP_LINKS = [
        {
            name: "Home",
            icon: "home",
            route: "/member/home",
        },
        {
            name: "My household",
            icon: "people-family-circle",
            route: "/member/household/",
            children: [
                {
                    name: "Profile",
                    route: "/member/household/profile",
                },
                {
                    name: "Dependents",
                    route: "/member/household/dependents",
                },
            ],
        },
        {
            name: "My coverage",
            route: "/member/coverage/enrollment/benefit-summary",
            icon: "coverage-shield",
            children: [
                {
                    name: "Summary",
                    route: "/member/coverage/enrollment/benefit-summary",
                },
                {
                    name: "Life events",
                    route: "/member/coverage/life-events/life-events",
                },
                {
                    name: "Beneficiaries",
                    route: "/member/coverage/beneficiaries",
                },
                {
                    name: "Completed Forms",
                    route: "/member/coverage/forms",
                },
                {
                    name: "Policy change requests",
                    route: "/member/coverage/change-requests",
                    config: this.staticUtil.cacheConfigEnabled("portal.member.policy_change_request.enable"),
                },
            ],
        },
        {
            name: "Messages",
            icon: "email",
            route: "/member/messageCenter/messages",
            config: this.staticUtil.cacheConfigEnabled(ConfigName.MESSAGE_CENTER_TOGGLE),
        },
        {
            name: "Resources",
            icon: "folder",
            route: "/member/resources",
            config: this.staticUtil.cacheConfigEnabled("portal.resources_config.enabled"),
            permission: this.store.select(SharedState.hasPermission("core.account.read.resource")),
        },
    ];

    treeFlattener = new MatTreeFlattener(
        SideNavComponent.transformer,
        (node) => node.level,
        (node) => node.expandable,
        (node) => node.children,
    );

    treeControl = new FlatTreeControl<SideNavFlatNode>(
        (node) => node.level,
        (node) => node.expandable,
    );
    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    constructor(
        readonly staticUtil: StaticUtilService,
        readonly store: Store,
        private readonly language: LanguageService,
        private readonly sharedService: SharedService,
    ) {
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isAgentSelfEnrolled = response;
            });
        if (this.isAgentSelfEnrolled) {
            this.SIDE_NAV_MMP_LINKS.push(
                {
                    name: this.languageStrings["primary.portal.agent.selfEnrollment.commissions"],
                    icon: COMMISSION_ICON_NAME,
                    route: COMMISSION_ROUTE,
                    config: this.staticUtil.cacheConfigEnabled(ConfigName.SELF_ENROLLMENT),
                    permission: this.store.select(SharedState.hasPermission(Permission.COMMISSION_READ)),
                },
                {
                    name: this.languageStrings["primary.portal.agent.selfEnrollment.business"],
                    icon: BUSINESS_ICON_NAME,
                    route: BUSINESS_ROUTE,
                    config: this.staticUtil.cacheConfigEnabled(ConfigName.SELF_ENROLLMENT),
                },
            );
        }
        this.dataSource.data = this.SIDE_NAV_MMP_LINKS;
    }

    private static transformer(
        { children, name, icon, route, config, permission }: SideNavNode,
        level: number,
    ): SideNavNode & { expandable: boolean; level: number } {
        return {
            expandable: !!children && children.length > 0,
            name,
            route,
            icon,
            level,
            config,
            permission,
        };
    }

    ngAfterViewInit(): void {
        this.tree.treeControl.expandAll();
    }

    hasChild = (_: number, node: SideNavFlatNode) => node.expandable;

    isParent = (_: number, node: SideNavFlatNode) => node.level === 0;

    /**
     * Implements Angular OnDestroy Life Cycle hook
     * unsubscribing all the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
