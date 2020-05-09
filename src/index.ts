import { omit } from './util/util';
import { instantiateDOMComponent, DOMRootComponent } from './vdom';
import { SandElement } from './element';
import { SandTagType, SandChildType, SandPropsType, SandKeyType } from './type';

export function render(element: SandElement, container: HTMLElement) {
    const vdom = instantiateDOMComponent(element);
    vdom.mountComponent(new DOMRootComponent(container));
}

interface ConfigType {
    key?: SandKeyType;
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

export { Component } from './component';
export { useState, useEffect } from './hook';
