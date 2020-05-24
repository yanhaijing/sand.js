import { ContextType } from './type';

export class Context {
    parent: Context | null;
    private data?: ContextType;
    constructor(parent: Context | null, data?: ContextType) {
        this.parent = parent;
        this.setData(data);
    }
    setData(data?: ContextType) {
        this.data = data;
    }
    getData() {
        const { data } = this;
        return typeof data === 'object' ? data : {};
    }

    getMixContext() {
        const res: ContextType = {};

        let curContext: Context | null | undefined = this;

        while (curContext) {
            const context = curContext.getData();

            for (let key of Object.keys(context)) {
                if (!(key in res)) {
                    res[key] = context[key];
                }
            }
            curContext = curContext.parent;
        }

        return res;
    }

    getContextByMap(map?: ContextType | null) {
        const res: ContextType = {};
        if (map == null) {
            return res;
        }
        
        const context = this.getMixContext();
        for(let key of Object.keys(map)) {
            res[key] = context[key];
        }

        return res;
    }
}
