import { omit } from './util/util';
import { instantiateDOMComponent } from './vdom';
import { SandElement } from './element';
import { SandTagType, SandChildType, SandPropsType, SandKeyType } from './type';

export function render(element: SandElement, container: HTMLElement) {
    const vdom = instantiateDOMComponent(element);
    vdom.mountComponent(container);
}

interface ConfigType {
    key?: SandKeyType;
}
export function createElement(
    tag: SandTagType,
    config?: ConfigType,
    children?: SandChildType | SandChildType[]
) {
    config = config == null ? {} : config;

    const key = config.key;
    const props = omit(config, ['key']) as SandPropsType;

    props.children =
        children == null ? [] : Array.isArray(children) ? children : [children];

    return new SandElement(tag, key, props);
}

export { Component } from './component';
