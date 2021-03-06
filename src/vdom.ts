/* eslint-disable @typescript-eslint/no-use-before-define */
// eslint-disable-next-line max-classes-per-file
import { SandElement } from './element';
import { Component, mergeState } from './component';
import { diffProps, diffChildren } from './diff';
import { FunctionComponentType, DoneType } from './type';
import {
    functionScopeStack,
    EffectFunctionType,
    EffectFunctionRetureType,
} from './hook';
import { Context } from './context';
import { SANDJS_PORTAL_TAG, SANDJS_PORTAL_CONTAINER } from './portal';

export type VdomType =
    | DOMTextComponent
    | DOMFragmentComponent
    | DOMComponent
    | DOMFunctionComponent
    | DOMCompositeComponent;

export function isVdom(vdom: any): vdom is VdomType {
    return (
        vdom instanceof DOMTextComponent ||
        vdom instanceof DOMFragmentComponent ||
        vdom instanceof DOMComponent ||
        vdom instanceof DOMFunctionComponent ||
        vdom instanceof DOMCompositeComponent
    );
}

type NativeDomType = Text | HTMLElement | Comment;

function getNativeDoms(vdom: VdomType | NativeDomType) {
    if (isVdom(vdom)) {
        return vdom.getNativeDoms();
    }

    return [vdom];
}
export class DOMTextComponent {
    text: string;
    textNode!: Text;
    parent!: VdomType | DOMRootComponent;
    element!: SandElement;
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;

    constructor(text?: string | number) {
        this.text = text == null ? '' : String(text);
    }
    getNativeDoms() {
        return this.textNode ? [this.textNode] : [];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    append(vdom: VdomType | NativeDomType) {
        /** 叶子节点 do nothing */
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    remove(vdom: VdomType) {
        /** 叶子节点 do nothing */
    }
    insertBefore(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        newItem: VdomType | NativeDomType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        existingItem: NativeDomType
    ) {
        /** 叶子节点 do nothing */
    }
    getContext(): Context {
        return this.parent.getContext();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleError(e: Error) {
        /** 叶子节点 do nothing */
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;

        const textNode = document.createTextNode(this.text);
        this.textNode = textNode;

        parent.append(this);
        done();
    }
    receiveComponent(done: DoneType, text?: string | number) {
        this.isDirty = false;
        text = text == null ? '' : String(text);
        if (text !== this.text) {
            this.textNode.textContent = text;
            this.text = text;
        }
        done();
    }
    unmountComponent() {
        this.parent.remove(this);
    }
}

export class DOMFragmentComponent {
    element: SandElement;
    parent!: VdomType | DOMRootComponent; // 父元素dom节点
    lastPlaceholderDom!: Comment; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    renderedElement!: SandElement;
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;

    constructor(element: SandElement) {
        this.element = element;
    }
    getNativeDoms(): NativeDomType[] {
        return [
            ...this.childVdoms.reduce(
                (prev, vdom) => [...prev, ...vdom.getNativeDoms()],
                [] as NativeDomType[]
            ),
            this.lastPlaceholderDom,
        ];
    }
    append(vdom: VdomType | NativeDomType) {
        this.parent.insertBefore(vdom, this.lastPlaceholderDom);
    }
    remove(vdom: VdomType) {
        this.parent.remove(vdom);
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        this.parent.insertBefore(newItem, existingItem);
    }
    getContext(): Context {
        return this.parent.getContext();
    }
    handleError(e: Error) {
        this.parent.handleError(e);
    }
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;

        const { element } = this;
        const { props } = element;

        const lastPlaceholderDom = document.createComment(
            'DOMFragmentComponent lastPlaceholderDom'
        );
        this.lastPlaceholderDom = lastPlaceholderDom;
        parent.append(lastPlaceholderDom);

        this.childVdoms = diffChildren(
            this,
            [],
            props.children,
            this.childVdoms,
            () => {
                done();
            }
        ); // 旧孩子设置为空，相当于全部设置为新的

        this.renderedElement = element;
    }
    receiveComponent(done: DoneType) {
        this.isDirty = false;
        const { element, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        this.childVdoms = diffChildren(
            this,
            curProps.children,
            nextProps.children,
            this.childVdoms,
            () => {
                done();
            }
        );
    }
    unmountComponent() {
        const { childVdoms } = this;

        for (const child of childVdoms) {
            child.unmountComponent();
        }
    }
}

export class DOMProtalComponent {
    element: SandElement;
    parent!: VdomType | DOMRootComponent; // 父元素dom节点
    protalContainer!: DOMRootComponent; // 父元素dom节点
    lastPlaceholderDom!: Comment; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    renderedElement!: SandElement;
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;

    constructor(element: SandElement) {
        this.element = element;
    }
    getNativeDoms(): NativeDomType[] {
        return [
            ...this.childVdoms.reduce(
                (prev, vdom) => [...prev, ...vdom.getNativeDoms()],
                [] as NativeDomType[]
            ),
            this.lastPlaceholderDom,
        ];
    }
    append(vdom: VdomType | NativeDomType) {
        this.protalContainer.insertBefore(vdom, this.lastPlaceholderDom);
    }
    remove(vdom: VdomType) {
        this.protalContainer.remove(vdom);
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        this.protalContainer.insertBefore(newItem, existingItem);
    }
    getContext(): Context {
        return this.parent.getContext();
    }
    handleError(e: Error) {
        this.parent.handleError(e);
    }
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;
        
        const { element } = this;
        const { props } = element;
        const protalContainer = new DOMRootComponent(props[SANDJS_PORTAL_CONTAINER]);
        this.protalContainer = protalContainer;

        const lastPlaceholderDom = document.createComment(
            'DOMProtalComponent lastPlaceholderDom'
        );
        this.lastPlaceholderDom = lastPlaceholderDom;
        protalContainer.append(lastPlaceholderDom);

        this.childVdoms = diffChildren(
            this,
            [],
            props.children,
            this.childVdoms,
            () => {
                done();
            }
        ); // 旧孩子设置为空，相当于全部设置为新的

        this.renderedElement = element;
    }
    receiveComponent(done: DoneType) {
        this.isDirty = false;
        const { element, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        this.childVdoms = diffChildren(
            this,
            curProps.children,
            nextProps.children,
            this.childVdoms,
            () => {
                done();
            }
        );
    }
    unmountComponent() {
        const { childVdoms } = this;

        for (const child of childVdoms) {
            child.unmountComponent();
        }
    }
}

export class DOMComponent {
    element: SandElement;
    parent!: VdomType | DOMRootComponent; // 父元素dom节点
    dom!: HTMLElement; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    renderedElement!: SandElement;
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;
    private listenterMap: { [key: string]: Function } = {};

    constructor(element: SandElement) {
        this.element = element;
        this.eventProxy = this.eventProxy.bind(this);
    }
    getNativeDoms() {
        return this.dom ? [this.dom] : [];
    }
    append(vdom: VdomType | NativeDomType) {
        getNativeDoms(vdom).forEach((dom) => {
            this.dom.appendChild(dom);
        });
    }
    remove(vdom: VdomType) {
        vdom.getNativeDoms().forEach((dom) => {
            this.dom.removeChild(dom);
        });
    }
    emptyDom() {
        const { dom } = this;
        dom.innerHTML = '';
    }
    empty() {
        this.childVdoms.forEach((child) => {
            child.unmountComponent();
        });
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        getNativeDoms(newItem).forEach((dom) => {
            this.dom.insertBefore(dom, existingItem);
        });
    }
    addEventListener(eventName: string, fn: Function) {
        const { dom, eventProxy, listenterMap } = this;

        if (typeof fn !== 'function') return;

        if (!listenterMap[eventName]) {
            dom.addEventListener(eventName, eventProxy);
        }

        listenterMap[eventName] = fn;
    }
    removeEventListener(eventName: string) {
        const { dom, eventProxy, listenterMap } = this;
        delete listenterMap[eventName];
        dom.removeEventListener(eventName, eventProxy);
    }
    eventProxy(e: Event) {
        const fn = this.listenterMap[e.type];
        fn.call(e.target, e);
    }
    getContext(): Context {
        return this.parent.getContext();
    }
    handleError(e: Error) {
        this.parent.handleError(e);
    }
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;

        const { element } = this;
        const tagName = element.type as string;
        const { props } = element;

        const dom = document.createElement(tagName);
        this.dom = dom;

        if (typeof props.ref === 'function') {
            props.ref(dom);
        }

        diffProps(this, { children: [] }, props); // 旧的属性设置为空，相当于全部设置为新的

        if (typeof props.dangerouslySetInnerHTML === 'object') {
            dom.innerHTML = props.dangerouslySetInnerHTML.__html;
            props.children = []; // 忽略子节点
        } else {
            this.childVdoms = diffChildren(
                this,
                [],
                props.children,
                this.childVdoms,
                done
            ); // 旧孩子设置为空，相当于全部设置为新的
        }

        parent.append(this);

        this.renderedElement = element;
    }
    receiveComponent(done: DoneType) {
        this.isDirty = false;
        const { element, renderedElement, dom } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        diffProps(this, curProps, nextProps);

        if (typeof nextProps.dangerouslySetInnerHTML === 'object') {
            if (
                typeof curProps.dangerouslySetInnerHTML !== 'object' ||
                nextProps.dangerouslySetInnerHTML.__html !==
                    curProps.dangerouslySetInnerHTML.__html
            ) {
                if (typeof curProps.dangerouslySetInnerHTML !== 'object') {
                    this.empty(); // 回收上次渲染的vdom
                }
                nextProps.children = []; // 忽略子节点
                dom.innerHTML = nextProps.dangerouslySetInnerHTML.__html;
            }
        } else {
            if (typeof curProps.dangerouslySetInnerHTML === 'object') {
                this.emptyDom(); // 清空上次渲染的 innerHTML
            }
            this.childVdoms = diffChildren(
                this,
                curProps.children,
                nextProps.children,
                this.childVdoms,
                done
            );
        }
    }
    unmountComponent() {
        const { parent, childVdoms } = this;

        for (const child of childVdoms) {
            child.unmountComponent();
        }

        parent.remove(this);
    }
}

export class DOMFunctionComponent {
    element: SandElement;
    componentInstance!: Component;
    parent!: VdomType | DOMRootComponent;
    lastPlaceholderDom!: Comment; // 当前元素dom节点
    vdoms: VdomType[] = [];
    renderedElements: SandElement[] = [];
    stateList: { state: any }[] = [];
    stateCursor = 0;
    effectList: EffectFunctionType[] = [];
    effectCbList: EffectFunctionRetureType[] = [];
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;

    constructor(element: SandElement) {
        this.element = element;
    }
    getNativeDoms(): NativeDomType[] {
        return [
            ...this.vdoms.reduce(
                (prev, vdom) => [...prev, ...vdom.getNativeDoms()],
                [] as NativeDomType[]
            ),
            this.lastPlaceholderDom,
        ];
    }
    append(vdom: VdomType | NativeDomType) {
        this.parent.insertBefore(vdom, this.lastPlaceholderDom);
    }
    remove(vdom: VdomType) {
        this.parent.remove(vdom);
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        this.parent.insertBefore(newItem, existingItem);
    }
    callEffect() {
        this.effectList.forEach((cb) => {
            const res = cb();

            // 需要清除的useEffect
            if (typeof res === 'function') {
                this.effectCbList.push(res);
            }
        });
    }
    getContext(): Context {
        return this.parent.getContext();
    }
    handleError(e: Error) {
        this.parent.handleError(e);
    }
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;

        const { element } = this;
        const component = element.type as FunctionComponentType;
        const { props } = element;
        const parentContext = parent.getContext();

        const lastPlaceholderDom = document.createComment(
            'DOMFunctionComponent lastPlaceholderDom'
        );
        this.lastPlaceholderDom = lastPlaceholderDom;
        parent.append(lastPlaceholderDom);

        try {
            functionScopeStack.push(this);
            this.stateCursor = 0;
            this.effectList = [];
            this.effectCbList = [];

            const res = component(
                props,
                parentContext.getContext(
                    component.contextType,
                    component.contextTypes
                )
            );
            functionScopeStack.pop();

            const nextElements = !res
                ? ([] as SandElement[])
                : Array.isArray(res)
                    ? res
                    : [res];

            this.renderedElements = nextElements;

            const nextVdoms = diffChildren(this, [], nextElements, [], () => {
                this.callEffect();
                done();
            });

            this.vdoms = nextVdoms;
        } catch (e) {
            this.handleError(e);
        }
    }
    receiveComponent(done: DoneType) {
        const { element, renderedElements, vdoms, isDirty, parent } = this;

        // 如果当前组件在待更新队列中，不执行
        if (isDirty) {
            return;
        }

        try {
            const parentContext = parent.getContext();
            const component = element.type as FunctionComponentType;
            const nextProps = element.props;

            functionScopeStack.push(this);
            this.stateCursor = 0;
            this.effectList = [];
            this.effectCbList = [];

            const res = component(
                nextProps,
                parentContext.getContext(
                    component.contextType,
                    component.contextTypes
                )
            );
            functionScopeStack.pop();

            const nextElements = !res
                ? ([] as SandElement[])
                : Array.isArray(res)
                    ? res
                    : [res];

            this.renderedElements = nextElements;

            const nextVdoms = diffChildren(
                this,
                renderedElements,
                nextElements,
                vdoms,
                () => {
                    this.callEffect();
                    done();
                }
            );

            this.vdoms = nextVdoms;
        } catch (e) {
            this.handleError(e);
        }
    }
    unmountComponent() {
        const { vdoms } = this;

        this.effectCbList.forEach((cb) => cb()); // 需要清除的useEffect
        vdoms.forEach((vdom) => vdom.unmountComponent());
    }
}

export class DOMCompositeComponent {
    element: SandElement; // 新的元素
    parent!: VdomType | DOMRootComponent;
    lastPlaceholderDom!: Comment; // 当前元素dom节点
    componentInstance!: Component;
    vdoms: VdomType[] = []; // 当前render对应的虚拟dom
    renderedElements: SandElement[] = []; // 当前渲染的元素
    previousVdomSibling?: VdomType;
    nextVdomSibling?: VdomType;
    isDirty = false;
    isForceUpdate = false;
    context?: Context;

    constructor(element: SandElement) {
        this.element = element;
    }
    getNativeDoms(): NativeDomType[] {
        return [
            ...this.vdoms.reduce(
                (prev, vdom) => [...prev, ...vdom.getNativeDoms()],
                [] as NativeDomType[]
            ),
            this.lastPlaceholderDom,
        ];
    }
    append(vdom: VdomType | NativeDomType) {
        this.parent.insertBefore(vdom, this.lastPlaceholderDom);
    }
    remove(vdom: VdomType) {
        this.parent.remove(vdom);
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        this.parent.insertBefore(newItem, existingItem);
    }
    getContext(): Context {
        const { context } = this;
        if (context) {
            return context;
        }

        return this.parent.getContext();
    }
    handleError(e: Error) {
        const { componentInstance, element } = this;
        const TagComponent = (element.type as unknown) as typeof Component;
        const hasGetError =
            typeof TagComponent.getDerivedStateFromError === 'function';
        const hasDidCatch =
            typeof componentInstance.componentDidCatch === 'function';

        if (!hasGetError && !hasDidCatch) {
            this.parent.handleError(e);
            return;
        }

        if (hasGetError) {
            const state = TagComponent.getDerivedStateFromError!(e);
            componentInstance.setState(state);
        }

        if (hasDidCatch) {
            componentInstance.componentDidCatch!(e);
        }
    }
    mountComponent(parent: VdomType | DOMRootComponent, done: DoneType) {
        this.parent = parent;

        const { element } = this;

        const TagComponent = (element.type as unknown) as typeof Component;
        const { props } = element;
        const parentContext = parent.getContext();

        const lastPlaceholderDom = document.createComment(
            'DOMCompositeComponent lastPlaceholderDom'
        );
        this.lastPlaceholderDom = lastPlaceholderDom;
        parent.append(lastPlaceholderDom);

        try {
            const componentInstance = new TagComponent(
                props,
                parentContext.getContext(
                    TagComponent.contextType,
                    TagComponent.contextTypes
                )
            );

            // 初始化 context
            if (typeof TagComponent.childContextType === 'object') {
                const curContext = new Context(
                    parentContext,
                    typeof componentInstance.getChildContext === 'function'
                        ? componentInstance.getChildContext()
                        : undefined,
                    TagComponent.childContextType
                );

                this.context = curContext;
            } else if (typeof TagComponent.childContextTypes === 'object') {
                const curContext = new Context(
                    parentContext,
                    typeof componentInstance.getChildContext === 'function'
                        ? componentInstance.getChildContext()
                        : undefined
                );

                this.context = curContext;
            }

            componentInstance._sandVdomInstance = this;

            this.componentInstance = componentInstance;

            const res = componentInstance.render();

            const nextElements = !res
                ? ([] as SandElement[])
                : Array.isArray(res)
                    ? res
                    : [res];

            this.renderedElements = nextElements;

            componentInstance.componentWillMount();

            const nextVdoms = diffChildren(this, [], nextElements, [], () => {
                done();
                try {
                    componentInstance.componentDidMount();
                } catch (e) {
                    parent.handleError(e);
                }
            });

            this.vdoms = nextVdoms;

            if (typeof props.ref === 'function') {
                props.ref(componentInstance);
            }
        } catch (e) {
            parent.handleError(e);
        }
    }
    receiveComponent(done: DoneType) {
        const {
            componentInstance,
            element,
            renderedElements,
            vdoms,
            isDirty,
            isForceUpdate,
            parent,
        } = this;

        // 如果当前组件在待更新队列中，不执行
        if (isDirty) {
            return;
        }

        const parentContext = parent.getContext();
        const TagComponent = (element.type as unknown) as typeof Component;
        const { state, cacheStates, setStateCallbacks } = componentInstance;
        const nextState = mergeState([state, ...cacheStates]);
        const nextProps = element.props;
        const nextContext = parentContext.getContext(
            TagComponent.contextType,
            TagComponent.contextTypes
        );

        try {
            componentInstance.componentWillReceiveProps(nextProps, nextContext);

            // 强制更新时，绕过shouldComponentUpdate
            if (
                !isForceUpdate &&
                !componentInstance.shouldComponentUpdate(
                    nextProps,
                    nextState,
                    nextContext
                )
            ) {
                return;
            }

            componentInstance.componentWillUpdate(
                nextProps,
                nextState,
                nextContext
            );

            componentInstance.state = nextState;
            componentInstance.props = nextProps;
            componentInstance.context = nextContext;
            // 更新 context
            if (this.context) {
                this.context.setData(
                    typeof componentInstance.getChildContext === 'function'
                        ? componentInstance.getChildContext()
                        : undefined
                );
            }
            const res = componentInstance.render();

            const nextElements = !res
                ? ([] as SandElement[])
                : Array.isArray(res)
                    ? res
                    : [res];

            this.renderedElements = nextElements;

            const nextVdoms = diffChildren(
                this,
                renderedElements,
                nextElements,
                vdoms,
                () => {
                    componentInstance.componentDidUpdate();
                    done();
                }
            );

            this.vdoms = nextVdoms;

            // 处理组件state
            setStateCallbacks.forEach((cb) => {
                cb(nextState);
            });
            componentInstance.cacheStates = [];
            componentInstance.setStateCallbacks = [];
            this.isForceUpdate = false;
        } catch (e) {
            parent.handleError(e);
        }
    }
    unmountComponent() {
        const { vdoms, componentInstance } = this;
        componentInstance.componentWillUnmount();
        vdoms.forEach((vdom) => vdom.unmountComponent());
    }
}

export class DOMRootComponent {
    dom: HTMLElement;
    context: Context;
    constructor(dom: HTMLElement) {
        this.dom = dom;
        this.context = new Context(null);
    }
    handleError(e: Error) {
        throw e;
    }
    append(vdom: VdomType | NativeDomType) {
        getNativeDoms(vdom).forEach((dom) => {
            this.dom.appendChild(dom);
        });
    }
    remove(vdom: VdomType) {
        vdom.getNativeDoms().forEach((dom) => {
            this.dom.removeChild(dom);
        });
    }
    insertBefore(
        newItem: VdomType | NativeDomType,
        existingItem: NativeDomType
    ) {
        getNativeDoms(newItem).forEach((dom) => {
            this.dom.insertBefore(dom, existingItem);
        });
    }
    getContext() {
        return this.context;
    }
}
export function instantiateDOMComponent(
    tag: SandElement | string | number | null | undefined
) {
    if (tag == null) {
        return new DOMTextComponent('');
    }

    // Portal
    if (typeof tag === 'object' && tag.type === SANDJS_PORTAL_TAG) {
        return new DOMProtalComponent(tag);
    }
    // fragment <></>
    if (typeof tag === 'object' && tag.type === '') {
        return new DOMFragmentComponent(tag);
    }
    // html tag
    if (typeof tag === 'object' && typeof tag.type === 'string') {
        return new DOMComponent(tag);
    }

    if (typeof tag === 'object' && typeof tag.type === 'function') {
        // 对象组件
        if (tag.type.prototype instanceof Component) {
            return new DOMCompositeComponent(tag);
        }

        // 函数组件
        return new DOMFunctionComponent(tag);
    }

    // text | number
    if (typeof tag === 'string' || typeof tag === 'number') {
        return new DOMTextComponent(tag);
    }

    // 用户传入未知参数
    // boolean 或其他对象等
    return new DOMTextComponent(String(tag));
}
