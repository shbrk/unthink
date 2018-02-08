/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-07 17:00:27
 */

import AST from "../../ast";
import { OUTTAG, APINode } from "../../astnode";

export default function (ast: AST, outPath: string, ejsPath: string) {
    let map = ast.getAPIMap(OUTTAG.server);
    let apiMap = new Map<string, Array<APINode>>();
    for (let an of map.values()) {
        let list = apiMap.get(an.mod);
        if (!list) {
            list = new Array<APINode>();
            apiMap.set(an.mod, list);
        }

        
    }
}


