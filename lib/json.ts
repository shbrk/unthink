import * as jsonCo from 'comment-json';
import * as fs from 'fs';

const PREFXI = '//';

export function requireJson(filePath: string) {
    return jsonCo.parse(fs.readFileSync(filePath).toString());
}

export function requireJsonNoComment(filePath: string) {
    return jsonCo.parse(fs.readFileSync(filePath).toString(), undefined, true);
}

export function isComment(probName: string) {
    if (probName && probName.startsWith(PREFXI)) return true; else return false;
}

export function makeCommentName(probName: string) {
    return `${PREFXI} ${probName}`;
}

export function getComment(probName: string, owner: any) {
    let coName = makeCommentName(probName);
    let co = owner[coName]
    if (Array.isArray(co) && co.length == 2) {
        if (Array.isArray(co[1]) && co[1][0]) {
            let str = co[1][0] as string;
            return str.substr(PREFXI.length);
        }
    }
    return null;
}