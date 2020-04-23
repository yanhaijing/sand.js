export function omit(obj: object, keys: string[]) {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) === -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {});
}

export function pick(obj: object, keys: string[]) {
    return Object.keys(obj)
        .filter((key) => keys.indexOf(key) !== -1)
        .reduce((res, key) => {
            res[key] = obj[key];
            return res;
        }, {});
}

export function propName2eventName(propName: string) {
    return propName.replace(/^on/, "").toLowerCase();
}

export function dash2camel(str: string) {
    return str.replace(/-([a-zA-Z])/g, (match, p1, offset) =>
        offset === 0 ? p1.toLowerCase() : p1.toUpperCase()
    );
}
