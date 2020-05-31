import { omit, noop } from './util/util';
import { instantiateDOMComponent, DOMRootComponent } from './vdom';
import { SandElement } from './element';
import {
    SandTagType,
    SandChildType,
    SandPropsType,
    SandKeyType,
    DoneType,
} from './type';

export function render(
    element: SandElement,
    container: HTMLElement,
    done: DoneType = noop
) {
    const vdom = instantiateDOMComponent(element);
    vdom.mountComponent(new DOMRootComponent(container), done);
}

interface ConfigType {
    key?: SandKeyType;
    [key: string]: any;
}
type ChildrenType = SandChildType[] | [SandChildType[]];

export function createElement(
    tag: SandTagType,
    config?: ConfigType,
    ...children: ChildrenType
) {
    config = config == null ? {} : config;

    const key = config.key;
    const props = omit(config, ['key']) as SandPropsType;

    const childfirst = children[0];
    const childs = Array.isArray(childfirst)
        ? childfirst
        : (children as SandChildType[]);

    props.children = childs;

    return new SandElement(tag, key, props);
}

export { Component, PureComponent } from './component';
export { Profiler } from './profiler';
export { Suspense } from './suspense';
export { Fragment } from './fragment';
export { useState, useEffect } from './hook';
export { createContext } from './context';
export { createPortal } from './portal';
export { memo } from './memo';
export { lazy } from './lazy';
