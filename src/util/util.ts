interface ObjectType {
    [key: string]: any;
}
export function noop() {}
export function omit(obj: ObjectType, keys: string[]): ObjectType {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) === -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {} as ObjectType);
}

export function pick(obj: ObjectType, keys: string[]) {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) !== -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {} as ObjectType);
}

export function propName2eventName(propName: string) {
    return propName.replace(/^on/, '').toLowerCase();
}

export function dash2camel(str: string) {
    return str.replace(/-([a-zA-Z])/g, (match, p1, offset) =>
        offset === 0 ? p1.toLowerCase() : p1.toUpperCase()
    );
}

// object shallow compare + object.children shallow compare
// array shallow compare
export function shallowCompare(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }

        return a.every((v, k) => v === b[k]);
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const keysa = Object.keys(a);
    
        if (keysa.length !== Object.keys(b).length) {
            return false;
        }
    
        return keysa.every((key) =>
            key === 'children' ? shallowCompare(a[key], b[key]) : a[key] === b[key]
        );
    }

    return a === b;
}
