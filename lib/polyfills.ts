if (typeof Promise.withResolvers === 'undefined') {
    Promise.withResolvers = function <T>() { // Add generic type <T>
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

export { };

// URL.parse Polyfill
if (typeof URL.parse === 'undefined') {
    URL.parse = function (url: string, base?: string) {
        try {
            return new URL(url, base);
        } catch (e) {
            return null;
        }
    };
}
