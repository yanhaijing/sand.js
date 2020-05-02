import { Component } from './component';
import { SandElement } from './element';

export type SandKeyType = string | number;
export interface SandStateType {
    [key: string]: any;
}

export interface FunctionComponentType {
    (props: SandPropsType): SandElement | SandElement[] | null;
}

export type SandTagType = string | Component | FunctionComponentType;
export type SandChildType = number | string | SandElement;

export interface SandPropsType {
    children: SandChildType[];
    [key: string]: any;
}

export interface SandStateCallBack {
    (nextState: SandStateType): void;
}
