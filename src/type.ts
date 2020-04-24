import { Component } from "./component";
import { SandElement } from "./element";

export type SandKeyType = string | number;
export type SandStateType = { [key: string]: any };
export type SandTagType = string | Component | Function;
export type SandChildType = number | string | SandElement;

export interface SandPropsType {
    children: SandChildType[];
    [key: string]: any;
}

export interface SandStateCallBack {
    (nextState: SandStateType): void;
}
