import { Component } from './component';
import { createElement } from '.';
import { SuspenseContext } from './suspense';
import { SandPropsType, ContextType } from './type';
import { SandElement } from './element';

export function lazy(fn: any) {
    const module$ = fn();

    class LazyComponentContainer extends Component {
        LazyComponent: any;
        constructor(props?: SandPropsType, context?: ContextType) {
            super(props, context);

            this.state = {
                isLoading: true,
            };

            module$.then((module: any) => {
                this.setState({
                    isLoading: false,
                });

                this.LazyComponent = module.default;
            });
        }
        render() {
            const { LazyComponent } = this;
            const { isLoading } = this.state;

            if (isLoading) {
                if (this.context) {
                    return this.context.fallback as SandElement;
                }
                return null;
            }

            return createElement(LazyComponent, this.props);
        }
    }
    LazyComponentContainer.contextType = SuspenseContext;

    return LazyComponentContainer as typeof Component;
}
