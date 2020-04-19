function omit(obj, keys) {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) === -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {});
}

function pick(obj, keys) {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) !== -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {});
}

class DOMTextComponent {
    constructor(text) {
        this.text = text;
        this.parentNode = null;
    }
    mountComponent(parentNode) {
        parentNode.innerText = this.text;
        this.parentNode = parentNode;
    }
    receiveComponent(text) {
        const { parentNode } = this;
        parentNode.innerText = text;
    }
}

class DOMComponent {
    constructor(element) {
        this.element = element;
        this.parentNode = null;
        this.vdom = null;
    }
    mountComponent(parentNode) {
        const { element } = this;

        const { type, props } = element;

        const tag = document.createElement(type);

        for (const [propName, prop] of Object.entries(props)) {
            if (propName !== "children") {
                tag.setAttribute(propName, prop);
            }
        }

        for (let child of props.children) {
            const childVdom = instantiateDOMComponent(child);
            childVdom.mountComponent(tag);
        }
        parentNode.appendChild(tag);
        this.parentNode = parentNode;
        this.vdom = tag;
    }
    receiveComponent(nextElement) {
        const {parentNode, element, vdom} = this;
        const nextProps = nextElement.props;
        const curProps = element.props;

        const mixProps = omit({...curProps, ...nextProps}, ['children']);
        // 更新属性
        for (let [propName, prop] of Object.entries(mixProps)) {
            // 需要出的属性
            if (!nextProps[propName]) {
                vdom.removeAttribute(propName);
            }

            // 新增加的属性
            if (!curProps[propName]) {
                vdom.setAttribute(propName, prop);
            }

            // 要更新的属性
            if (curProps[propName] !== nextProps[propName]) {
                vdom.setAttribute(propName, prop);
            }
        }
    }
}
class DOMCompositeComponent {
    constructor(element) {
        this.element = element;
        this.instance = null;
        this.parentNode = null;
        this.vdom = null;
        this.renderedElement = null;
    }

    mountComponent(parentNode) {
        const { element } = this;

        const { type: Component, props } = element;

        const instance = new Component();
        instance._reactInternalInstance = this;

        this.instance = instance;
        const nextElement = instance.render();
        this.renderedElement = nextElement;

        const vdom = instantiateDOMComponent(nextElement);

        vdom.mountComponent(parentNode);
        this.parentNode = parentNode;
        this.vdom = vdom;
    }
    receiveComponent(newState) {
        const { instance, element, parentNode, renderedElement, vdom } = this;

        const nextState = { ...instance.state, ...newState };
        const nextProps = element.props;

        instance.state = nextState;
        const nextElement = instance.render();
        this.renderedElement = nextElement;

        if (renderedElement.type === nextElement.type) {
            vdom.receiveComponent(nextElement);
        } else {
            const nextVdom = instantiateDOMComponent(nextElement);
            nextVdom.mountComponent(parentNode);
            this.vdom = nextVdom;
        }
    }
}

function SandElement(type, key, props) {
    this.type = type;
    this.key = key;
    this.props = props || {};
}

class Component {
    constructor(props) {
        this.props = props;
    }
    setState(newState) {
        console.log("Component setState", newState);

        this._reactInternalInstance.receiveComponent(newState);
    }
    render() {}
}
function instantiateDOMComponent(node) {
    if (typeof node === "string" || typeof node === "number") {
        return new DOMTextComponent(node);
    }

    if (typeof node === "object" && typeof node.type === "string") {
        return new DOMComponent(node);
    }

    if (typeof node === "object" && typeof node.type === "function") {
        return new DOMCompositeComponent(node);
    }
}

function render(element, container) {
    const vdom = instantiateDOMComponent(element);
    vdom.mountComponent(container);
}

function createElement(tag, config, children) {
    config = config || {};

    const key = config.key || null;
    const props = omit(config, ["key"]);
    props.children = Array.isArray(children) ? children : [];

    return new SandElement(tag, key, props);
}
