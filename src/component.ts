import { SandStateType, SandPropsType, SandStateCallBack } from './type';
import { DOMCompositeComponent } from './vdom';
import { SandElement } from './element';

export class Component {
    props: SandPropsType;
    state!: SandStateType;
    cacheStates: SandStateType[];
    setStateCallbacks: SandStateCallBack[];
    _sandVdomInstance!: DOMCompositeComponent;

    constructor(props?: SandPropsType) {
        this.props = props || { children: [] };
        this.cacheStates = [];
        this.setStateCallbacks = [];
    }

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
            // 合并state
            const nextMixState = cacheStates.reduce(
                (res, cur) => ({ ...res, ...cur }),
                {}
            ) as SandStateType;

            this._sandVdomInstance.receiveComponent(nextMixState);

            this.setStateCallbacks.forEach((cb) => {
                cb(nextMixState);
            });

            this.cacheStates = [];
            this.setStateCallbacks = [];
        }, 0);
    }
    componentWillMount() {}
    componentDidMount() {}
    componentWillUnmount() {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shouldComponentUpdate(nextProps: SandPropsType, nextState: SandStateType) {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    componentWillReceiveProps(nextProps: SandPropsType) {}
    componentWillUpdate() {}
    componentDidUpdate() {}
    forceUpdate() {
        throw new Error('Component forceUpdate need TODO');
    }
    render(): SandElement | SandElement[] | null {
        throw new Error('Sand Component need render method');
    }
}
