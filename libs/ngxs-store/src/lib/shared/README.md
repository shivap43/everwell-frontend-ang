# Shared Actions

### Author: Tim Nowaczewski

## ResetState

The ResetState action is dispatched on logout action to reset all state slices to the original defaults.
To implement, any default that is specified in the `@State` decorator will need to be moved into a `const` in the file, and then assigned to the default field. Then, the `@Action` `ResetState` will need to be caught in every State to reset it to the constant declared.

Previous state decorator:

```
...
  @State<AudienceGroupBuilderStateModel>({
      name: "AudienceGroupBuilder",
      defaults: {
          classTypesRequested: false,
          classTypes: [],
          classNames: [],
          regionTypesRequested: false,
          regionTypes: [],
          regions: [],
          productsRequested: false,
          productOfferings: []
      }
  })
  @Injectable()
...
```

Decorator after ResetState implementation:

```
...
  const defaultState: AudienceGroupBuilderStateModel = {
      classTypesRequested: false,
      classTypes: [],
      classNames: [],
      regionTypesRequested: false,
      regionTypes: [],
      regions: [],
      productsRequested: false,
      productOfferings: [],
  };

  @State<AudienceGroupBuilderStateModel>({
      name: "AudienceGroupBuilder",
      defaults: defaultState,
  })
  @Injectable()
```

... and the `@Action` function added to the state:

```
...
    @Action(ResetState)
    resetState(context: StateContext<AudienceGroupBuilderStateModel>): void {
        context.setState(defaultState);
    }
...
```
