import {
    FunctionComponentType,
    SandPropsType,
    SandStateType,
    ContextType,
} from './type';
import { PureComponent } from './component';
import { createElement } from '.';

export function memo(
    fc: FunctionComponentType,
    areEqual?: any
): typeof PureComponent {
    class MemoComponent extends PureComponent {
        shouldComponentUpdate(
            nextProps: SandPropsType,
            nextState: SandStateType,
            nextContext: ContextType
        ) {
            if (typeof areEqual === 'function') {
                return !areEqual(this.props, nextProps);
            }

            return super.shouldComponentUpdate(
                nextProps,
                nextState,
                nextContext
            );
        }
        render() {
            return createElement(fc, this.props);
        }
    }

    return MemoComponent;
}
