import { Component } from './component';
import { createContext } from './context';
import { createElement } from '.';

export const SuspenseContext = createContext({
    fallback: createElement(''),
});

export class Suspense extends Component {
    render() {
        return createElement(
            (SuspenseContext.Provider as unknown) as Component,
            {
                value: { fallback: this.props.fallback },
            },
            this.props.children
        );
    }
}
