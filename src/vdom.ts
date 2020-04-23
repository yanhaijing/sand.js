import { SandElement } from "./element";
import { Component } from "./component";
import { diffProps, diffChildren } from "./diff";
import { SandStateType } from "./type";

export type VdomType =
    | DOMTextComponent
    | DOMComponent
    | DOMFunctionComponent
    | DOMCompositeComponent;

export class DOMTextComponent {
    text: string;
    textNode: Text = null;
    parentNode: HTMLElement = null;

    constructor(text?: string | number) {
        this.text = text == null ? "" : String(text);
    }
    mountComponent(parentNode: HTMLElement) {
        const textNode = document.createTextNode(this.text);

        parentNode.appendChild(textNode);

        this.textNode = textNode;
        this.parentNode = parentNode;
    }
    receiveComponent(text?: string) {
        text = text == null ? "" : text;
        if (text !== this.text) {
            this.textNode.textContent = text;
            this.text = text;
        }
    }
    unmountComponent() {
        this.parentNode.removeChild(this.textNode);
    }
}

export class DOMComponent {
    element: SandElement;
    parentNode: HTMLElement = null; // 父元素dom节点
    dom: HTMLElement = null; // 当前元素dom节点
    childVdoms: VdomType[] = []; // 子元素虚拟dom节点
    constructor(element: SandElement) {
        this.element = element;
    }
    mountComponent(parentNode: HTMLElement) {
        const { element } = this;
        const tagName = element.type as string;
        const { props } = element;

        const dom = document.createElement(tagName);

        diffProps(dom, { children: [] }, props); // 旧的属性设置为空，相当于全部设置为新的

        this.childVdoms = diffChildren(dom, [], props.children, this.childVdoms); // 旧孩子设置为空，相当于全部设置为新的

        parentNode.appendChild(dom);
        this.parentNode = parentNode;
        this.dom = dom;
    }
    receiveComponent(nextElement: SandElement) {
        const { element, dom } = this;
        const nextProps = nextElement.props;
        const curProps = element.props;

        this.element = nextElement;

        diffProps(dom, curProps, nextProps);
        this.childVdoms = diffChildren(dom, curProps.children, nextProps.children, this.childVdoms);
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
    instance = null;
    parentNode: HTMLElement = null;
    vdom: VdomType = null;
    renderedElement: SandElement = null;
    constructor(element: SandElement) {
        this.element = element;
    }

    mountComponent(parentNode: HTMLElement) {
        const { element } = this;
        const component = element.type as Function;
        const { props } = element;

        const nextElement = component(props);
        this.renderedElement = nextElement;

        const vdom = instantiateDOMComponent(nextElement);

        vdom.mountComponent(parentNode);
        this.parentNode = parentNode;
        this.vdom = vdom;
    }
    receiveComponent(newState: SandStateType) {
        const { element, parentNode, renderedElement, vdom } = this;

        const component = element.type as Function;
        const nextProps = element.props;

        const nextElement = component(nextProps);
        this.renderedElement = nextElement;

        if (renderedElement.type === nextElement.type) {
            vdom.receiveComponent(nextElement);
        } else {
            vdom.unmountComponent();
            const nextVdom = instantiateDOMComponent(nextElement);
            nextVdom.mountComponent(parentNode);
            this.vdom = nextVdom;
        }
    }
    unmountComponent() {
        const { vdom } = this;
        vdom.unmountComponent();
    }
}

export class DOMCompositeComponent {
    element: SandElement;
    instance = null;
    parentNode = null;
    vdom = null;
    renderedElement = null;
    constructor(element: SandElement) {
        this.element = element;
    }

    mountComponent(parentNode: HTMLElement) {
        const { element } = this;

        const Component = element.type as Component;
        const { props } = element;

        const instance = new Component(props);
        instance.sandInternalInstance = this;

        this.instance = instance;
        const nextElement = instance.render();
        this.renderedElement = nextElement;

        instance.componentWillMount();

        const vdom = instantiateDOMComponent(nextElement);

        vdom.mountComponent(parentNode);
        this.parentNode = parentNode;
        this.vdom = vdom;

        instance.componentDidMount();
    }
    receiveComponent(newState: SandStateType) {
        const { instance, element, parentNode, renderedElement, vdom } = this;

        const nextState = { ...instance.state, ...newState };
        const nextProps = element.props;

        instance.state = nextState;
        const nextElement = instance.render();
        this.renderedElement = nextElement;

        instance.componentWillReceiveProps(nextProps);

        if (!instance.shouldComponentUpdate(nextProps, newState)) {
            return;
        }
        instance.componentWillUpdate();

        if (renderedElement.type === nextElement.type) {
            vdom.receiveComponent(nextElement);
        } else {
            vdom.unmountComponent();
            const nextVdom = instantiateDOMComponent(nextElement);
            nextVdom.mountComponent(parentNode);
            this.vdom = nextVdom;
        }

        instance.componentDidUpdate();
    }
    unmountComponent() {
        const { vdom, instance } = this;
        instance.componentWillUnmount();
        vdom.unmountComponent();
    }
}

export function instantiateDOMComponent(node: SandElement | string | number) {
    // text | number
    if (typeof node === "string" || typeof node === "number") {
        return new DOMTextComponent(node);
    }

    // html tag
    if (typeof node === "object" && typeof node.type === "string") {
        return new DOMComponent(node);
    }

    if (typeof node === "object" && typeof node.type === "function") {
        // 对象组件
        if (node.type.prototype instanceof Component) {
            return new DOMCompositeComponent(node);
        }

        // 函数组件
        return new DOMFunctionComponent(node);
    }
}
