class DOMTextComponent {
    constructor(text) {
        this.text = text;
    }
    mountComponent(parentNode) {
        parentNode.innerText = this.text;
    }
}

class DOMComponent {
    constructor(element) {
        this.element = element;
    }
    mountComponent(parentNode) {
        const {element} = this;

        const {type, props} = element;

        const tag = document.createElement(type);

        for(let child of props.children) {
            const childVdom = instantiateDOMComponent(child);
            childVdom.mountComponent(tag);
        }
        parentNode.appendChild(tag);
    }
}
class DOMCompositeComponent {
    constructor(element) {
        this.element = element;
        this.instance = null; 
    }

    mountComponent(parentNode) {
        const {element} = this;

        const {type: Component, props} = element;

        const instance = this.instance = new Component();

        const vdom = instantiateDOMComponent(instance.render());

        vdom.mountComponent(parentNode);
    }
}

function SandElement(type, key, props) {
    this.type = type;
    this.key = key;
    this.props = props;
}

class Component {
    constructor(props) {

    }
    setState() {

    }
    render() {

    }
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

function createElement(tag, props, children) {
    props = props || {};
    props.children = children;
    return new SandElement(tag, null, props);
}
