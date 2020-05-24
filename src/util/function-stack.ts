import { DOMFunctionComponent } from '../vdom';

type FunctionScopeType = DOMFunctionComponent;
type FunctionScopeStackType = FunctionScopeType[];

export class FunctionStack {
    stack: FunctionScopeStackType = [];
    push(scope: FunctionScopeType) {
        this.stack.push(scope);
    }
    pop() {
        this.stack.pop();
    }
    get() {
        return this.stack[this.stack.length - 1];
    }
}