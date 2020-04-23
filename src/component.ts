import { SandStateType, SandPropsType, SandStateCallBack } from "./type";

export class Component {
    props: SandPropsType;
    cacheStates: SandStateType[];
    setStateCallbacks: SandStateCallBack[];
    sandInternalInstance: any;

    constructor(props?: SandPropsType) {
        this.props = props || { children: [] };
        this.cacheStates = [];
        this.setStateCallbacks = [];
    }

    setState(nextState: SandStateType, cb?: SandStateCallBack) {
        const { cacheStates } = this;

        cacheStates.push(nextState);

        if (typeof cb === "function") {
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
            );
            this.sandInternalInstance.receiveComponent(nextMixState);

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
    shouldComponentUpdate(nextProps: SandPropsType, nextState: SandStateType) {
        return true;
    }
    componentWillReceiveProps(nextProps: SandPropsType) {}
    componentWillUpdate() {}
    componentDidUpdate() {}
    forceUpdate() {
        throw new Error("Component forceUpdate need TODO");
    }
    render() {
        throw new Error("Sand Component need render method");
    }
}
