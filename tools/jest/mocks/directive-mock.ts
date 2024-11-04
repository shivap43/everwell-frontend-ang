import { Directive, EventEmitter } from "@angular/core";

/**
 * Examples:
 * MockDirective({selector: '[some-directive]'});
 * MockDirective({selector: '[some-directive]', inputs: ['some-input', 'some-other-input']});
 */
export function MockDirective(selector: string, options: Directive = {}): Directive {
    const metadata: Directive = {
        selector,
        inputs: options.inputs || [],
        outputs: options.outputs || [],
        providers: options.providers || [],
        exportAs: options.exportAs || "",
    };

    class Mock {
        constructor() {
            metadata.outputs.forEach(method => {
                this[method] = new EventEmitter<any>();
            });
        }
    }

    return Directive(metadata)(Mock as any);
}
