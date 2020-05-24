import { Component } from './component';
import { SandElement } from './element';
import { CustomContext } from './context';

export interface ContextType {
    [key: string]: any;
}
export type ChildContextType = ContextType;
export type SandKeyType = string | number;
export interface SandStateType {
    [key: string]: any;
}

export interface FunctionComponentType {
    (props: SandPropsType, context: ContextType):
    | SandElement
    | SandElement[]
    | null;
    contextTypes?: ContextType;
    contextType?: CustomContext;
}

export type SandTagType = string | Component | FunctionComponentType;
export type SandChildType = number | string | SandElement;

export interface SandPropsType {
    children: SandChildType[];
    ref?: (ref: HTMLElement | Component) => void;
    dangerouslySetInnerHTML?: { __html: string };
    [key: string]: any;
}

export interface SandStateCallBack {
    (nextState: SandStateType): void;
}

export interface DoneType {
    (): void;
}
