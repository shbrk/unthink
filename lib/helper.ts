export function concatMap(maps: Map<any, any>[]) {
    let ret = new Map<any, any>();
    for (let m of maps) {
        for (let [k, v] of m.entries()) {
            ret.set(k, v);
        }
    }
    return ret;
}