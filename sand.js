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

function propName2eventName(propName) {
    return propName.replace(/^on/, "").toLowerCase();
}
function dash2camel(str) {
    return str.replace(/-([a-zA-Z])/g, (match, p1, offset) =>
        offset === 0 ? p1.toLowerCase() : p1.toUpperCase()
    );
}

function setStyle(style, key, value) {
    key = dash2camel(key);
    if (value == null) {
        style[key] = "";
    } else {
        style[key] = value;
    }
}

function setProp(dom, name, value, oldValue) {
    if (name === "style") {
        style = dom.style;

        if (typeof value === "string") {
            style.cssText = value;
        } else {
            if (typeof oldValue === "string") {
                style.cssText = "";
            } else {
                oldValue = oldValue || {};
                value = value || {};

                for (const key of Object.keys(oldValue)) {
                    if (!(key in value)) {
                        setStyle(style, key, "");
                    }
                }

                for (const key of Object.keys(value)) {
                    if (value[key] !== oldValue[key]) {
                        setStyle(style, key, value[key]);
                    }
                }
            }
        }
    } else if (
        ["selected", "selectedIndex", "checked", "value"].indexOf(name) !==
            -1 &&
        name in dom
    ) {
        dom[name] = value;
    } else {
        // 处理className和htmlFor
        if (name === "className") {
            name = "class";
        } else if (name === "htmlFor") {
            name = "for";
        }
        if (value == null || value === false) {
            dom.removeAttribute(name);
        } else {
            dom.setAttribute(name, value);
        }
    }
}

class DOMTextComponent {
    constructor(text) {
        this.text = text;
        this.parentNode = null;
        this.textNode = null;
    }
    mountComponent(parentNode) {
        const textNode = document.createTextNode(this.text);
        parentNode.appendChild(textNode);
        this.parentNode = parentNode;
        this.textNode = textNode;
    }
    receiveComponent(text) {
        this.textNode.textContent = text;
    }
    unmountComponent() {
        this.parentNode.removeChild(this.textNode);
    }
}

class DOMComponent {
    constructor(element) {
        this.element = element;
        this.parentNode = null;
        this.vdom = null;
        this.childVdoms = [];
    }
    diffProps(vdom, curProps, nextProps) {
        const mixProps = omit({ ...curProps, ...nextProps }, ["children"]);

        // 更新属性
        for (let [propName, prop] of Object.entries(mixProps)) {
            // 需要移除的属性
            if (!nextProps[propName]) {
                if (/^on[A-Za-z]/.test(propName)) {
                    vdom.removeEventListener(
                        propName2eventName(propName),
                        prop
                    );
                } else {
                    setProp(vdom, propName);
                }
            }

            // 新增加的属性
            if (!curProps[propName]) {
                if (/^on[A-Za-z]/.test(propName)) {
                    vdom.addEventListener(propName2eventName(propName), prop);
                } else {
                    setProp(vdom, propName, prop);
                }
            }

            // 要更新的属性
            if (curProps[propName] !== nextProps[propName]) {
                if (/^on[A-Za-z]/.test(propName)) {
                    vdom.removeEventListener(
                        propName2eventName(propName),
                        curProps[propName]
                    );
                    vdom.addEventListener(propName2eventName(propName), prop);
                } else {
                    setProp(vdom, propName, prop);
                }
            }
        }
    }
    diffChildren(vdom, curChildren, nextChildren) {
        const { childVdoms } = this;
        const curChildrenMap = curChildren.reduce((map, child, index) => {
            const key = child.key || index;
            map[key] = {
                child,
                used: false,
                index: index,
            };
            return map;
        }, {});

        let lastIndex = 0;
        let curIndex = 0;

        this.childVdoms = [];

        for (const child of nextChildren) {
            const key = child.key || curIndex;

            const prevChild = curChildrenMap[key];

            if (prevChild && prevChild.child.type === child.type) {
                const childvdom = childVdoms[prevChild.index];

                childvdom.receiveComponent(child);
                prevChild.used = true;
                if (prevChild.index < lastIndex) {
                    vdom.appendChild(childvdom.vdom);
                } else {
                    lastIndex = prevChild.index;
                }
                this.childVdoms.push(childvdom);
            } else {
                // 新增的节点
                const childVdom = instantiateDOMComponent(child);
                childVdom.mountComponent(vdom);
                this.childVdoms.push(childVdom);
            }

            curIndex = curIndex + 1;
        }
        // 删除用不到的节点
        for (const map of Object.values(curChildrenMap)) {
            if (!map.used) {
                childVdoms[map.index].unmountComponent();
            }
        }
    }
    mountComponent(parentNode) {
        const { element } = this;

        const { type, props } = element;

        const tag = document.createElement(type);

        for (const [propName, prop] of Object.entries(props)) {
            if (propName === "children") {
                break;
            }
            // 事件
            if (/^on[A-Za-z]/.test(propName)) {
                tag.addEventListener(propName2eventName(propName), prop);
            } else {
                setProp(tag, propName, prop)
            }
        }

        for (let child of props.children) {
            const childVdom = instantiateDOMComponent(child);
            childVdom.mountComponent(tag);
            this.childVdoms.push(childVdom);
        }
        parentNode.appendChild(tag);
        this.parentNode = parentNode;
        this.vdom = tag;
    }
    receiveComponent(nextElement) {
        const { element, vdom } = this;
        const nextProps = nextElement.props;
        const curProps = element.props;

        this.element = nextElement;

        this.diffProps(vdom, curProps, nextProps);

        const nextChildren = nextProps.children;
        const curChildren = curProps.children;
        this.diffChildren(vdom, curChildren, nextChildren);
    }
    unmountComponent() {
        const { parentNode, childVdoms, vdom } = this;

        for (const child of childVdoms) {
            child.unmountComponent();
        }

        parentNode.removeChild(vdom);
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

function SandElement(type, key, props) {
    this.type = type;
    this.key = key;
    this.props = props || {};
}

class Component {
    constructor(props) {
        this.props = props;
        this.cacheStates = [];
        this.setStateCallbacks = [];
    }
    setState(newState, cb) {
        const { cacheStates } = this;

        cacheStates.push(newState);
        if (typeof cb === "function") {
            this.setStateCallbacks.push(cb);
        }

        // 非首次setState
        if (cacheStates.length > 1) {
            return;
        }

        setTimeout(() => {
            // 合并state
            const newState = cacheStates.reduce(
                (res, cur) => ({ ...res, ...cur }),
                {}
            );
            this._reactInternalInstance.receiveComponent(newState);

            this.setStateCallbacks.forEach((cb) => {
                cb(newState);
            });

            this.cacheStates = [];
            this.setStateCallbacks = [];
        }, 0);
    }
    shouldComponentUpdate(nextProps, nextState) {
        return true;
    }
    componentWillMount() {

    }
    componentDidMount() {

    }
    componentWillUnmount() {

    }
    componentWillReceiveProps(newProps) {

    }
    componentWillUpdate() {
        
    }
    componentDidUpdate() {

    }
    forceUpdate() {
        
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
