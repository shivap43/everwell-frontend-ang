import { Component, EventEmitter } from "@angular/core";

/**
 * Examples:
 * MockComponent("some-component");
 * MockComponent("some-component", {inputs: ["some-input", "some-other-input"]});
 */
export function MockComponent(selector: string, options: Component = {}): Component {
    const metadata: Component = {
        selector,
        template: options.template || "",
        inputs: options.inputs || [],
        outputs: options.outputs || [],
        exportAs: options.exportAs || "",
    };

    class Mock {
        constructor() {
            metadata.outputs.forEach(method => {
                this[method] = new EventEmitter<any>();
            });
        }
    }

    return Component(metadata)(Mock as any);
}
