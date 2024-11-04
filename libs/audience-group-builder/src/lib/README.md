# Audience Group Builder

### Author: Tim Nowaczewski

Used to build and edit an audience group.

### HTML

```html
<empowered-audience-builder-container
  [displayAudienceGroupTypes]="['SSN', 'EMPLOYEE_ID', 'EMPLOYMENT_STATUS', 'CLAZZ', 'REGION', 'ENROLLMENT_PLAN']"
  [initialAudienceGrouping]="audienceGrouping"
  (audienceGrouping)="print($event)"
>
</empowered-audience-builder-container>
```

- displayAudienceGroupTypes: Types of audience types that are to be displayed. Corresponds to the Audience type for the API; not all types have been implemented.
- initialAudienceGrouping: The initial audience grouping (if it exists)
- audienceGrouping: The event that is emitted whenever the audience group is editted. Emits the current full audience group.

### Component

```javascript
AudienceBuilderContainerComponent.determineCRUDOperations(initial, current);
```

Helps to determine what operations need to be performed to update the API. Contains two lists of audiences: a list of deletions (remove), and a list of additions (create). Both lists are relative to the initial audience grouping and the current grouping.
