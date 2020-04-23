import { instantiateDOMComponent, VdomType } from "./vdom";
import { dash2camel, omit, propName2eventName } from "./util/util";
import { SandPropsType, SandChildType } from "./type";

type PropValueType = object | string | boolean | number | null;

function setStyle(
    style: CSSStyleDeclaration,
    key: string,
    value: string | number | null
) {
    key = dash2camel(key);
    if (value == null) {
        style[key] = "";
    } else {
        style[key] = value;
    }
}

export function setProp(
    dom: HTMLElement,
    name: string,
    value?: PropValueType,
    oldValue?: PropValueType
) {
    if (name === "style") {
        const style = dom.style;

        if (typeof value === "string") {
            style.cssText = value;
        } else {
            if (typeof oldValue === "string") {
                style.cssText = "";
            } else {
                oldValue = typeof oldValue === "object" ? oldValue : {};
                value = typeof value === "object" ? value : {};

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
            dom.setAttribute(name, String(value));
        }
    }
}

export function diffProps(
    dom: HTMLElement,
    curProps: SandPropsType,
    nextProps: SandPropsType
) {
    const mixProps = omit({ ...curProps, ...nextProps }, ["children"]);

    // 更新属性
    for (const propName of Object.keys(mixProps)) {
        if (propName === "children") {
            break;
        }
        
        const prop = mixProps[propName];
        // 需要移除的属性
        if (!nextProps[propName]) {
            if (/^on[A-Za-z]/.test(propName)) {
                dom.removeEventListener(propName2eventName(propName), prop);
            } else {
                setProp(dom, propName);
            }
        }

        // 新增加的属性
        if (!curProps[propName]) {
            if (/^on[A-Za-z]/.test(propName)) {
                dom.addEventListener(propName2eventName(propName), prop);
            } else {
                setProp(dom, propName, prop);
            }
        }

        // 要更新的属性
        if (curProps[propName] !== nextProps[propName]) {
            if (/^on[A-Za-z]/.test(propName)) {
                dom.removeEventListener(
                    propName2eventName(propName),
                    curProps[propName]
                );
                dom.addEventListener(propName2eventName(propName), prop);
            } else {
                setProp(dom, propName, prop);
            }
        }
    }
}

export function diffChildren(
    dom: HTMLElement,
    curChildren: SandChildType[],
    nextChildren: SandChildType[],
    childVdoms: VdomType[],
) {
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

    const newChildVdoms = [];

    for (const child of nextChildren) {
        const key = child.key || curIndex;

        const prevChild = curChildrenMap[key];

        if (prevChild && prevChild.child.type === child.type) {
            const childvdom = childVdoms[prevChild.index];

            childvdom.receiveComponent(child);
            prevChild.used = true;
            if (prevChild.index < lastIndex) {
                dom.appendChild(childvdom.vdom);
            } else {
                lastIndex = prevChild.index;
            }
            newChildVdoms.push(childvdom);
        } else {
            // 新增的节点
            const childVdom = instantiateDOMComponent(child);
            childVdom.mountComponent(dom);
            newChildVdoms.push(childVdom);
        }

        curIndex = curIndex + 1;
    }
    // 删除用不到的节点
    for (const key of Object.keys(curChildrenMap)) {
        const map = curChildrenMap[key];
        if (!map.used) {
            childVdoms[map.index].unmountComponent();
        }
    }

    return newChildVdoms;
}
