import { Component } from "./component";
import { SandElement } from "./element";

export type SandKeyType = string | number;
export type SandStateType = object;
export type SandTagType = string | Component | Function;
export type SandChildType = number | string | SandElement;

export interface SandPropsType {
    children: SandChildType[]
};

export interface SandStateCallBack {
    (nextState: SandStateType): void;
}
