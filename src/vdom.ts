/* eslint-disable @typescript-eslint/no-use-before-define */
// eslint-disable-next-line max-classes-per-file
import { SandElement } from './element';
import { Component } from './component';
import { diffProps, diffChildren } from './diff';
import { SandStateType } from './type';
import {
    functionScopeStack,
    EffectFunctionType,
    EffectFunctionRetureType,
} from './hook';

export type VdomType =
    | DOMTextComponent
    | DOMFragmentComponent
    | DOMComponent
    | DOMFunctionComponent
    | DOMCompositeComponent;

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
    mountComponent(parentNode: HTMLElement) {
        const textNode = document.createTextNode(this.text);

        parentNode.appendChild(textNode);

        this.textNode = textNode;
        this.parentNode = parentNode;
    }
    receiveComponent(text?: string | number) {
        text = text == null ? '' : String(text);
        if (text !== this.text) {
            this.textNode.textContent = text;
            this.text = text;
        }
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
    mountComponent(parentNode: HTMLElement) {
        const { element } = this;
        const { props } = element;

        const dom = parentNode;

        this.childVdoms = diffChildren(
            dom,
            [],
            props.children,
            this.childVdoms
        ); // 旧孩子设置为空，相当于全部设置为新的

        this.parentNode = parentNode;
        this.dom = dom;
        this.renderedElement = element;
    }
    receiveComponent() {
        const { element, dom, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        this.childVdoms = diffChildren(
            dom,
            curProps.children,
            nextProps.children,
            this.childVdoms
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
    mountComponent(parentNode: HTMLElement) {
        const { element } = this;
        const tagName = element.type as string;
        const { props } = element;

        const dom = document.createElement(tagName);

        diffProps(dom, { children: [] }, props); // 旧的属性设置为空，相当于全部设置为新的

        this.childVdoms = diffChildren(
            dom,
            [],
            props.children,
            this.childVdoms
        ); // 旧孩子设置为空，相当于全部设置为新的

        parentNode.appendChild(dom);
        this.parentNode = parentNode;
        this.dom = dom;
        this.renderedElement = element;
    }
    receiveComponent() {
        const { element, dom, renderedElement } = this;
        const nextProps = element.props;
        const curProps = renderedElement.props;

        this.renderedElement = element;

        diffProps(dom, curProps, nextProps);
        this.childVdoms = diffChildren(
            dom,
            curProps.children,
            nextProps.children,
            this.childVdoms
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
    vdom!: VdomType;
    renderedElement!: SandElement;
    stateList: { state: any }[] = [];
    stateCursor = 0;
    effectList: EffectFunctionType[] = [];
    effectCbList: EffectFunctionRetureType[] = [];
    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        this.vdom.appendTo(parentNode);
        this.parentNode = parentNode;
    }
    callEffect() {
        this.effectList.forEach(cb => {
            const res = cb();

            // 需要清除的useEffect
            if (typeof res === 'function') {
                this.effectCbList.push(res);
            }
        });
    }
    mountComponent(parentNode: HTMLElement) {
        const { element } = this;
        const component = element.type as Function;
        const { props } = element;

        functionScopeStack.push(this);
        this.stateCursor = 0;
        this.effectList = [];
        this.effectCbList = [];
        const nextElement = component(props) as SandElement;
        functionScopeStack.pop();

        this.renderedElement = nextElement;

        const vdom = instantiateDOMComponent(nextElement);

        vdom.mountComponent(parentNode);
        this.parentNode = parentNode;
        this.vdom = vdom;

        this.callEffect();
    }
    receiveComponent() {
        const { element, parentNode, renderedElement, vdom } = this;

        const component = element.type as Function;
        const nextProps = element.props;

        functionScopeStack.push(this);
        this.stateCursor = 0;
        this.effectList = [];
        this.effectCbList = [];
        const nextElement = component(nextProps) as SandElement;
        functionScopeStack.pop();

        this.renderedElement = nextElement;

        if (renderedElement.type === nextElement.type) {
            vdom.element = nextElement;
            vdom.receiveComponent();
        } else {
            vdom.unmountComponent();
            const nextVdom = instantiateDOMComponent(nextElement);
            nextVdom.mountComponent(parentNode);
            this.vdom = nextVdom;
        }

        this.callEffect();
    }
    unmountComponent() {
        const { vdom } = this;
        vdom.unmountComponent();

        this.effectCbList.forEach((cb) => cb()); // 需要清除的useEffect
    }
}

export class DOMCompositeComponent {
    element: SandElement; // 新的元素
    parentNode!: HTMLElement;
    componentInstance!: Component;
    vdom!: VdomType; // 当前render对应的虚拟dom
    renderedElement!: SandElement; // 当前渲染的元素

    constructor(element: SandElement) {
        this.element = element;
    }
    appendTo(parentNode = this.parentNode) {
        this.vdom.appendTo(parentNode);
        this.parentNode = parentNode;
    }
    mountComponent(parentNode: HTMLElement) {
        const { element } = this;

        const TagComponent = element.type as typeof Component;
        const { props } = element;

        const componentInstance = new TagComponent(props);
        componentInstance._sandVdomInstance = this;

        this.componentInstance = componentInstance;
        const nextElement = componentInstance.render();

        if (!nextElement) {
            return;
        }

        this.renderedElement = nextElement;

        componentInstance.componentWillMount();

        const vdom = instantiateDOMComponent(nextElement);

        vdom.mountComponent(parentNode);
        this.parentNode = parentNode;
        this.vdom = vdom;

        componentInstance.componentDidMount();
    }
    receiveComponent(newState?: SandStateType) {
        const {
            componentInstance,
            element,
            parentNode,
            renderedElement,
            vdom,
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
        const nextElement = componentInstance.render();

        if (!nextElement) {
            return;
        }

        this.renderedElement = nextElement;

        if (renderedElement.type === nextElement.type) {
            vdom.element = nextElement;
            vdom.receiveComponent();
        } else {
            vdom.unmountComponent();
            const nextVdom = instantiateDOMComponent(nextElement);
            nextVdom.mountComponent(parentNode);
            this.vdom = nextVdom;
        }

        componentInstance.componentDidUpdate();
    }
    unmountComponent() {
        const { vdom, componentInstance } = this;
        componentInstance.componentWillUnmount();
        vdom.unmountComponent();
    }
}

export function instantiateDOMComponent(tag: SandElement | string | number) {
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
    return new DOMTextComponent('unknow tag');
}
