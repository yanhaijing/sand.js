/* eslint-disable @typescript-eslint/no-use-before-define */
// eslint-disable-next-line max-classes-per-file
import { SandElement } from './element';
import { Component } from './component';
import { diffProps, diffChildren } from './diff';
import { SandStateType, FunctionComponentType } from './type';
import {
    functionScopeStack,
    EffectFunctionType,
    EffectFunctionRetureType,
} from './hook';
import { noop } from './util/util';

export type VdomType =
    | DOMTextComponent
    | DOMFragmentComponent
    | DOMComponent
    | DOMFunctionComponent
    | DOMCompositeComponent;

interface DoneType {
    (): void;
}

export class DOMTextComponent {
    text: string;
    textNode!: Text;
    parentNode!: HTMLElement;
    element!: SandElement;

    constructor(text?: string | number) {
        this.text = text == null ? '' : String(text);
    }
    appendTo(parentNode = this.parentNode) {
        parentNode.appendChild(this.textNode);

        this.parentNode = parentNode;
    }
    mountComponent(parentNode: HTMLElement, done: DoneType = noop) {
        const textNode = document.createTextNode(this.text);

        parentNode.appendChild(textNode);

        this.textNode = textNode;
        this.parentNode = parentNode;
        done();
    }
    receiveComponent(done: DoneType, text?: string | number) {
        text = text == null ? '' : String(text);
        if (text !== this.text) {
            this.textNode.textContent = text;
            this.text = text;
        }
        done();
    }
    unmountComponent() {
        this.parentNode.removeChild(this.textNode);
    }
}

export class DOMFragmentComponent {
    element: SandElement;
    parentNode!: HTMLElement; // 父元素dom节点
    dom!: HTMLElement; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    renderedElement!: SandElement;

    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        for (const vdom of this.childVdoms) {
            vdom.appendTo(parentNode);
        }

        this.parentNode = parentNode;
        this.dom = parentNode;
    }
    mountComponent(parentNode: HTMLElement, done: DoneType = noop) {
        const { element } = this;
        const { props } = element;

        const dom = parentNode;

        this.childVdoms = diffChildren(
            dom,
            [],
            props.children,
            this.childVdoms,
            done
        ); // 旧孩子设置为空，相当于全部设置为新的

        this.parentNode = parentNode;
        this.dom = dom;
        this.renderedElement = element;
    }
    receiveComponent(done: DoneType) {
        const { element, dom, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        this.childVdoms = diffChildren(
            dom,
            curProps.children,
            nextProps.children,
            this.childVdoms,
            done
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
    parentNode!: HTMLElement; // 父元素dom节点
    dom!: HTMLElement; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    renderedElement!: SandElement;

    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        parentNode.appendChild(this.dom);

        this.parentNode = parentNode;
    }
    mountComponent(parentNode: HTMLElement, done: DoneType = noop) {
        const { element } = this;
        const tagName = element.type as string;
        const { props } = element;

        const dom = document.createElement(tagName);

        diffProps(dom, { children: [] }, props); // 旧的属性设置为空，相当于全部设置为新的

        this.childVdoms = diffChildren(
            dom,
            [],
            props.children,
            this.childVdoms,
            done
        ); // 旧孩子设置为空，相当于全部设置为新的

        parentNode.appendChild(dom);
        this.parentNode = parentNode;
        this.dom = dom;
        this.renderedElement = element;
    }
    receiveComponent(done: DoneType) {
        const { element, dom, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        diffProps(dom, curProps, nextProps);
        this.childVdoms = diffChildren(
            dom,
            curProps.children,
            nextProps.children,
            this.childVdoms,
            done
        );
    }
    unmountComponent() {
        const { parentNode, childVdoms, dom } = this;

        for (const child of childVdoms) {
            child.unmountComponent();
        }

        parentNode.removeChild(dom);
    }
}

export class DOMFunctionComponent {
    element: SandElement;
    componentInstance!: Component;
    parentNode!: HTMLElement;
    vdoms: VdomType[] = [];
    renderedElements: SandElement[] = [];
    stateList: { state: any }[] = [];
    stateCursor = 0;
    effectList: EffectFunctionType[] = [];
    effectCbList: EffectFunctionRetureType[] = [];
    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        this.vdoms.forEach((vdom) => vdom.appendTo(parentNode));
        this.parentNode = parentNode;
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
    mountComponent(parentNode: HTMLElement, done: DoneType = noop) {
        const { element } = this;
        const component = element.type as FunctionComponentType;
        const { props } = element;

        functionScopeStack.push(this);
        this.stateCursor = 0;
        this.effectList = [];
        this.effectCbList = [];
        const res = component(props);
        functionScopeStack.pop();

        const nextElements = !res
            ? ([] as SandElement[])
            : Array.isArray(res)
                ? res
                : [res];

        this.renderedElements = nextElements;

        const nextVdoms = diffChildren(parentNode, [], nextElements, [], done);

        this.parentNode = parentNode;
        this.vdoms = nextVdoms;

        this.callEffect();
    }
    receiveComponent(done: DoneType) {
        const { element, parentNode, renderedElements, vdoms } = this;

        const component = element.type as FunctionComponentType;
        const nextProps = element.props;

        functionScopeStack.push(this);
        this.stateCursor = 0;
        this.effectList = [];
        this.effectCbList = [];
        const res = component(nextProps);
        functionScopeStack.pop();

        const nextElements = !res
            ? ([] as SandElement[])
            : Array.isArray(res)
                ? res
                : [res];

        this.renderedElements = nextElements;

        const nextVdoms = diffChildren(
            parentNode,
            renderedElements,
            nextElements,
            vdoms,
            () => {
                this.callEffect();
                done();
            }
        );

        this.vdoms = nextVdoms;
    }
    unmountComponent() {
        const { vdoms } = this;

        this.effectCbList.forEach((cb) => cb()); // 需要清除的useEffect
        vdoms.forEach((vdom) => vdom.unmountComponent());
    }
}

export class DOMCompositeComponent {
    element: SandElement; // 新的元素
    parentNode!: HTMLElement;
    componentInstance!: Component;
    vdoms: VdomType[] = []; // 当前render对应的虚拟dom
    renderedElements: SandElement[] = []; // 当前渲染的元素

    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        this.vdoms.forEach((vdom) => vdom.appendTo(parentNode));
        this.parentNode = parentNode;
    }
    mountComponent(parentNode: HTMLElement, done: DoneType = noop) {
        const { element } = this;

        const TagComponent = (element.type as unknown) as typeof Component;
        const { props } = element;

        const componentInstance = new TagComponent(props);
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

        const nextVdoms = diffChildren(parentNode, [], nextElements, [], done);

        this.parentNode = parentNode;
        this.vdoms = nextVdoms;

        componentInstance.componentDidMount();
    }
    receiveComponent(done: DoneType, newState?: SandStateType) {
        const {
            componentInstance,
            element,
            parentNode,
            renderedElements,
            vdoms,
        } = this;

        const nextState = { ...componentInstance.state, ...newState };
        const nextProps = element.props;

        componentInstance.componentWillReceiveProps(nextProps);

        componentInstance.state = nextState;
        componentInstance.props = nextProps;

        if (!componentInstance.shouldComponentUpdate(nextProps, nextState)) {
            return;
        }

        componentInstance.componentWillUpdate();
        const res = componentInstance.render();

        const nextElements = !res
            ? ([] as SandElement[])
            : Array.isArray(res)
                ? res
                : [res];

        this.renderedElements = nextElements;

        const nextVdoms = diffChildren(
            parentNode,
            renderedElements,
            nextElements,
            vdoms,
            () => {
                done();
                componentInstance.componentDidUpdate();
            }
        );

        this.vdoms = nextVdoms;

        
    }
    unmountComponent() {
        const { vdoms, componentInstance } = this;
        componentInstance.componentWillUnmount();
        vdoms.forEach((vdom) => vdom.unmountComponent());
    }
}

export function instantiateDOMComponent(
    tag: SandElement | string | number | null | undefined
) {
    if (tag == null) {
        return new DOMTextComponent('');
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
