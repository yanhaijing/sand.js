/* eslint-disable max-classes-per-file */
import { ContextType, SandPropsType, FunctionComponentType, ChildContextType } from './type';
import { Component } from './component';
import { SandElement } from './element';

export class CustomContext {
    readonly defaultValue: any;
    Provider: typeof Component;
    Consumer: FunctionComponentType;
    constructor(defaultValue: any) {
        this.defaultValue = defaultValue;

        class Provider extends Component {
            getChildContext() {
                return {
                    value: 'value' in this.props ? this.props.value : defaultValue
                };
            }
            render() {
                return this.props.children as SandElement[];
            }
        }
        Provider.childContextType = this;
        this.Provider = Provider;

        function Consumer(props: SandPropsType, context: ContextType) {
            const { children } = props;
            const [firstChild] = children;
            if (typeof firstChild === 'function') {
                return (firstChild as Function)(context);
            }
            return children;
        }
        Consumer.contextType = this;
        this.Consumer = Consumer;
    }
}
export function createContext(defaultValue: any) {
    return new CustomContext(defaultValue);
}

export class Context {
    parent: Context | null;
    type?: CustomContext;
    private data?: ContextType;
    constructor(parent: Context | null, data?: ContextType, type?: CustomContext) {
        this.parent = parent;
        this.type = type;
        this.setData(data);
    }
    setData(data?: ContextType) {
        this.data = data;
    }
    getData() {
        const { data } = this;
        return typeof data === 'object' ? data : {};
    }

    getMixContext() {
        const res: ContextType = {};

        let curContext: Context | null | undefined = this;

        while (curContext) {
            const context = curContext.getData();

            for (let key of Object.keys(context)) {
                if (!(key in res)) {
                    res[key] = context[key];
                }
            }
            curContext = curContext.parent;
        }

        return res;
    }

    getContextByMap(map?: ContextType | null) {
        const res: ContextType = {};
        if (map == null) {
            return res;
        }

        const context = this.getMixContext();
        for (let key of Object.keys(map)) {
            res[key] = context[key];
        }

        return res;
    }
    getContextByType(type?: CustomContext) {
        if (type == null) {
            return;
        }

        let curContext: Context | null | undefined = this;

        while (curContext) {
            if (curContext.type === type) {
                return curContext.getData().value;
            }
            curContext = curContext.parent;
        }
    }
    getContext(contextType?: CustomContext, contextTypes?: ChildContextType) {
        if (contextType instanceof CustomContext) {
            return this.getContextByType(contextType);
        } 

        return this.getContextByMap(contextTypes);
    }
}
