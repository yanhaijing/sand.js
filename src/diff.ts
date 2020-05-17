import {
    instantiateDOMComponent,
    VdomType,
    DOMTextComponent,
    DOMComponent,
} from './vdom';
import { dash2camel, propName2eventName } from './util/util';
import { SandPropsType, SandChildType } from './type';
import { SandElement } from './element';
import { Transaction, globalTaskQueue } from './queue';

type PropValueType = { [key: string]: any } | string | boolean | number | null;

function isTextChild(child: SandChildType) {
    const type = typeof child;
    return type === 'string' || type === 'number';
}

function setStyle(
    style: CSSStyleDeclaration,
    key: string,
    value: string | number | null
) {
    key = dash2camel(key);
    if (value == null) {
        // @ts-ignore
        style[key] = '';
    } else {
        // @ts-ignore
        style[key] = String(value);
    }
}

export function setProp(
    dom: HTMLElement,
    name: string,
    value?: PropValueType,
    oldValue?: PropValueType
) {
    if (name === 'style') {
        const style = dom.style;

        if (typeof value === 'string') {
            style.cssText = value;
        } else {
            if (typeof oldValue === 'string') {
                style.cssText = '';
            } else {
                const safeOldValue =
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    typeof oldValue === 'object' ? oldValue! : {};
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const safeValue = typeof value === 'object' ? value! : {};

                for (const key of Object.keys(safeOldValue)) {
                    if (!(key in safeValue)) {
                        setStyle(style, key, '');
                    }
                }

                for (const key of Object.keys(safeValue)) {
                    if (safeValue[key] !== safeOldValue[key]) {
                        setStyle(style, key, safeValue[key]);
                    }
                }
            }
        }
    } else if (
        ['selected', 'selectedIndex', 'checked', 'value'].indexOf(name) !==
            -1 &&
        name in dom
    ) {
        // TODO: fix
        // @ts-ignore
        dom[name] = value;
    } else {
        // 处理className和htmlFor
        if (name === 'className') {
            name = 'class';
        } else if (name === 'htmlFor') {
            name = 'for';
        }
        if (value == null || value === false) {
            dom.removeAttribute(name);
        } else {
            dom.setAttribute(name, String(value));
        }
    }
}

export function diffProps(
    vdom: DOMComponent,
    curProps: SandPropsType,
    nextProps: SandPropsType
) {
    const dom = vdom.dom;
    const mixProps = { ...curProps, ...nextProps } as SandPropsType;

    // 更新属性
    for (const propName of Object.keys(mixProps)) {
        if (
            propName === 'children' ||
            propName === 'ref' ||
            propName === 'dangerouslySetInnerHTML'
        ) {
            continue;
        }

        const isEvent = propName[0] === 'o' && propName[1] === 'n';
        const prop = mixProps[propName];
        // 需要移除的属性
        if (!(propName in nextProps)) {
            if (isEvent) {
                vdom.removeEventListener(propName2eventName(propName));
            } else {
                setProp(dom, propName);
            }
            continue;
        }

        // 新增加的属性
        if (!(propName in curProps)) {
            if (isEvent) {
                vdom.addEventListener(propName2eventName(propName), prop);
            } else {
                setProp(dom, propName, prop);
            }
            continue;
        }

        // 要更新的属性
        if (curProps[propName] !== nextProps[propName]) {
            if (isEvent) {
                vdom.addEventListener(propName2eventName(propName), prop);
            } else {
                setProp(dom, propName, prop);
            }
        }
    }
}

interface ChildMapType {
    [key: string]: {
        child: SandChildType;
        used: boolean;
        index: number;
    };
}
function getChildKey(child: SandChildType, defaultKey: number) {
    return child instanceof SandElement ? child.key || defaultKey : defaultKey;
}
export function diffChildren(
    vdom: VdomType,
    curChildren: SandChildType[],
    nextChildren: SandChildType[],
    childVdoms: VdomType[],
    done: () => void
) {
    const curChildrenMap = curChildren.reduce((map, child, index) => {
        map[getChildKey(child, index)] = {
            child,
            used: false,
            index: index,
        };
        return map;
    }, {} as ChildMapType);

    let lastIndex = 0;
    let curIndex = 0;

    const newChildVdoms = [];

    const transaction = new Transaction(() => {
        done();
    });

    for (const child of nextChildren) {
        const prevChild = curChildrenMap[getChildKey(child, curIndex)];

        if (prevChild) {
            // 都是组件，且类型相同
            if (
                child instanceof SandElement &&
                prevChild.child instanceof SandElement &&
                prevChild.child.type === child.type
            ) {
                const childvdom = childVdoms[prevChild.index];
                childvdom.element = child;
                childvdom.isDirty = true;
                // 添加到事务
                transaction.add((done) => {
                    childvdom.isDirty = false;
                    childvdom.receiveComponent(done);
                });
                prevChild.used = true;
                if (prevChild.index < lastIndex) {
                    // 添加到事务
                    transaction.add((done) => {
                        vdom.append(childvdom); // 移动到当前父元素的最后面
                        done();
                    });
                } else {
                    lastIndex = prevChild.index;
                }
                newChildVdoms.push(childvdom);
            } else if (isTextChild(child) && isTextChild(prevChild.child)) {
                // 都是text
                const childvdom = childVdoms[
                    prevChild.index
                ] as DOMTextComponent;
                prevChild.used = true;
                childvdom.isDirty = true;
                transaction.add((done) => {
                    childvdom.isDirty = false;
                    childvdom.receiveComponent(done, child as string);
                });
                newChildVdoms.push(childvdom);
            } else {
                // 都是组件，组件类型不同时 | 文本->dom, dom -> 文本
                // 新增节点，旧节点抛弃，后面统一unmount
                const childVdom = instantiateDOMComponent(child);
                // 添加到事务
                transaction.add((done) => {
                    childVdom.mountComponent(vdom, done);
                });
                newChildVdoms.push(childVdom);
            }
        } else {
            // 新增的节点
            const childVdom = instantiateDOMComponent(child);
            // 添加到事务
            transaction.add((done) => {
                childVdom.mountComponent(vdom, done);
            });
            newChildVdoms.push(childVdom);
        }

        // 设置节点指针
        if (curIndex > 0) {
            newChildVdoms[curIndex].previousVdomSibling =
                newChildVdoms[curIndex - 1];
            newChildVdoms[curIndex - 1].nextVdomSibling =
                newChildVdoms[curIndex];
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

    globalTaskQueue.add(transaction); // 指定队列
    return newChildVdoms;
}
