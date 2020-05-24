import {
    SandStateType,
    SandPropsType,
    SandStateCallBack,
    ContextType,
    ChildContextType,
} from './type';
import { DOMCompositeComponent } from './vdom';
import { SandElement } from './element';
import { noop, shallowCompare } from './util/util';
import { CustomContext } from './context';

export function mergeState(stateList: SandStateType[]) {
    return stateList.reduce(
        (res, cur) => ({ ...res, ...cur }),
        {}
    ) as SandStateType;
}


export class Component {
    static contextTypes?: ContextType;
    static childContextTypes?: ChildContextType;
    static contextType?: CustomContext;
    static childContextType?: CustomContext;
    props: SandPropsType;
    state!: SandStateType;
    context?: ContextType;
    cacheStates: SandStateType[];
    setStateCallbacks: SandStateCallBack[];
    _sandVdomInstance!: DOMCompositeComponent;

    constructor(props?: SandPropsType, context?: ContextType) {
        this.props = props || { children: [] };
        this.context = context;
        this.cacheStates = [];
        this.setStateCallbacks = [];
    }
    getChildContext?(): ChildContextType
    setState(nextState: SandStateType, cb?: SandStateCallBack) {
        const { cacheStates } = this;

        cacheStates.push(nextState);

        if (typeof cb === 'function') {
            this.setStateCallbacks.push(cb);
        }

        // 非首次setState
        if (cacheStates.length > 1) {
            return;
        }

        setTimeout(() => {
            this._sandVdomInstance.receiveComponent(noop);
        }, 0);
    }
    componentWillMount() {}
    componentDidMount() {}
    componentWillUnmount() {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shouldComponentUpdate(nextProps: SandPropsType, nextState: SandStateType, nextContext: ContextType) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    componentWillReceiveProps(nextProps: SandPropsType, nextContext: ContextType) {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    componentWillUpdate(nextProps: SandPropsType, nextState: SandStateType, nextContext: ContextType) {}
    componentDidUpdate() {}
    forceUpdate() {
        this._sandVdomInstance.isForceUpdate = true;
        this._sandVdomInstance.receiveComponent(noop);
    }
    render(): SandElement | SandElement[] | null {
        throw new Error('Sand Component need render method');
    }
}

export class PureComponent extends Component {
    shouldComponentUpdate(nextProps: SandPropsType, nextState: SandStateType) {
        const { props, state } = this;

        return !(
            shallowCompare(props, nextProps) && shallowCompare(state, nextState)
        );
    }
}
