import { FunctionStack } from './util/function-stack';

export const functionScopeStack = new FunctionStack();

export function useState<T>(initState: T) {
    const curF = functionScopeStack.get();
    const { stateList, stateCursor } = curF;

    if (!stateList[stateCursor]) {
        stateList[stateCursor] = { state: initState };
    }

    const state = stateList[stateCursor].state;

    const cb = (newState: T) => {
        stateList[stateCursor].state = newState;

        curF.receiveComponent(() => null);
    };

    curF.stateCursor = stateCursor + 1;
    return [state, cb];
}

export type EffectFunctionRetureType = () => void;

export interface EffectFunctionType {
    (): void | EffectFunctionRetureType;
}
export function useEffect(cb: EffectFunctionType) {
    const curF = functionScopeStack.get();

    const { effectList } = curF;

    effectList.push(cb);
}
