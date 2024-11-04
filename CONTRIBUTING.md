# Code Standards

#### Table Of Contents

-   **![](https://cdn0.iconfinder.com/data/icons/octicons/1024/git-branch-24.png) [Git](#git-standards)**
    -   [Commit Message Format](#commit-message-format)
    -   [Submitting Pull Requests](#submitting-pull-requests)
-   **![](https://cdn4.iconfinder.com/data/icons/logos-and-brands-1/512/21_Angular_logo_logos-24.png) [Angular](#angular)**
    -   [Forms](#forms)
    -   [State Management](#state-management)
-   **![](https://cdn2.iconfinder.com/data/icons/font-awesome/1792/info-circle-24.png) [Quick Links](#quick-links)**

#### Special Review Cases

1. **Changes to Router Config** - Requires approval from at least one onshore lead before merge.
2. **Changes to NGXS Store** - Requires approval from at least one onshore lead before merge.
3. **Changes to API Library** - Requires team leads to check [API contract compliance](https://api-contracts.empoweredbenefits.com).

#### Key guidelines

-   Having **custom form controls** for reusable forms, simple example Phone, Email and Address page.
-   **CDK Stepper** for navigations instead of routers. Please find working POC below with multiple components
-   Any flows that need to load / unload form partials should either use a custom version of Materials **CdkStepper** (https://material.angular.io/cdk/stepper/overview) or CdkPortal (https://material.angular.io/cdk/portal/overview) without requiring a route change.
-   **POC** for reference https://test-mat-stepper-card.stackblitz.io
-   Adherence to **WCAG & ADA compliance** guidelines through Pa11y reports integrated onto EVE/Portals. In coming days we will integrate Pa11y to Azure ci process for PR approvals.
-   Memory leak issue should be addressed timely **subscribes should always be associated with unsubscribe/Async/ngOnDestroy**
-   We should always be using **ReactiveForms and the FormBuiler API**. Avoid duplication of state properties to NgXs store.
-   If developers need to temporarily comment out code, either for debugging or refactoring, they must begin the comment block with a rationale **(FIXME – The code below breaks the template or <!-- TODO – Add search bar here -->)**
-   Any validation message/server side errors which has no content finalized will have a place holder message (as communicated by UX and Content team) **FPO - <Jira Ticket>** example: “FPO – EVE-123”  
    (FPO stands for For Position Only)
-   Detailed PR comment cannot be “Please DO NOT DELETE BRANCH”, there has to be a detailed description about PR code changes.
-   **Console.log** should be avoided , I still see multiple of them in develop branch.
-   Spinners for api integrated calls wherever necessary.
-   We should not be using EVE-Tst as proxy settings in the develop branch. EVE-Tst urls should be only used for QA. Please add your local proxy file in .gitignore
-   Please avoid creating multiple interfaces for properties of same type.
-   **Schemas: [NO_ERRORS_SCHEMA]**, should not be used in unit test cases.
-   Reactive forms object creation - Always use **form builder to create form group** instead of using new FormGroup().
-   User [] syntax to create formControl instead of using new FormControl.
-   Use fb.array instead of using new FormArray
-   Example
    **Use**

```
  this.fb.group({
       phone: ["", Validators.pattern(this.MOBILE_REGEX)]
  });
```

**instead of**

```
this.fb.group({
    phone : new FormControl("", Validators.pattern(this.MOBILE_REGEX))
});
```

### ReadMe within projects & style guides:

-   [Core guidelines](https://github.com/Aflac-SCM/everwell-frontend-ang/blob/main/apps/client/src/app/core/README.md)
-   [Shared guidelines](https://github.com/Aflac-SCM/everwell-frontend-ang/blob/main/libs/shared/README.md)
-   [Scss guidelines](https://github.com/Aflac-SCM/everwell-frontend-ang/blob/main/libs/shared/src/lib/scss/README.md)

## Git Standards

### Commit Message Format

Each commit message consists of a **header** and a **body**. The header has a special format that includes a **jira ticket reference** and a **subject**:

```
<jira-tag> - <summary of changes in ~50 characters>
<BLANK LINE>
<body>
```

The **header** is mandatory. On _RARE_ occasions, you may omit the **jira ticket reference** when a commit does not correspond to a ticket.

The **body** is optional, because most commits should be sufficiently small and self-explanatory. However, it should be included whenever you need to provide a more detailed explanation about _what_ and _why_ the code changed.

Just focus on making clear the reasons why you made the change in the first place—the way things worked before the change (and what was wrong with that), the way they work now, and why you decided to solve it the way you did.

> NOTE: Any line of the commit message should not be longer **72 characters**! This allows the message to be easier to read on Bitbucket as well as in various git tools.

#### Samples Commit Messages:

> NOTE: Whenever possible use the imperative mood and specify the **scope** of a change…

```
EVE-123 - Adds firstName input to AccountFormComponent
```

```
EVE-456 - Scaffolds new WidgetComponent in Dashoard library
```

> NOTE: If a commit needs additional explanation, use the body…

```
EVE-123 – Refactors AccountFormComponent

This component can be re-used in the Member library, so it has been
refactored into a separate library named `@empowered/account-form`.

Additional changes:
- Updated routing in AccountComponent
- Updated routing in MemberComponent
- Updated includes property of `apps/client/tsconfig.app.json`
```

### Submitting Pull Requests

**Please follow these basic steps to simplify pull request reviews. If you don't you'll probably just be asked to anyway.**

-   Limit the number of files changed (20 files max).
-   Clean up commit messages using interactive rebase to match the standards above.
-   Run `ng test` and unsure all test suites pass.
-   Run `ng lint` and ensure all automatic code quality standards are met.

## MAP/MPP/MMP Architecture links for Global navigation

-   [MAP Information architecture](https://confluence.empoweredbenefits.com/display/CREAT/MAP+Information+architecture)
-   [MPP Information architecture](https://confluence.empoweredbenefits.com/display/CREAT/MPP+Information+architecture)
-   [MMP Information architecture](https://confluence.empoweredbenefits.com/display/CREAT/MMP+Information+architecture)

## Quick Links

Below is a list of quick links to documentation and resources commonly used in this project…

-   [API Contracts](https://api-contracts.empoweredbenefits.com)
-   [UX Style Guide](https://zeroheight.com/0ydh214)
-   [UX HiFi Designs](https://app.abstract.com/organizations/0a1aa56e-feb5-4728-a496-0e2c58d2d1b9/projects)
-   [Official Angular Docs](https://angular.io/)
-   [Angular Material Docs](https://material.angular.io/)
-   [NGXS Docs](https://ngxs.gitbook.io/ngxs/)
