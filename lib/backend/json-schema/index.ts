/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-23 10:20:52
 */

import AST from "../../ast";
import { OUTTAG, APINode, VarNode } from "../../astnode";

export default function (ast: AST, outPath: string, ejsPath: string) {
    let map = ast.getAPIMap(OUTTAG.server);
    let apiMap = new Map<string, Array<APINode>>();
    for (let an of map.values()) {
        let list = apiMap.get(an.mod);
        if (!list) {
            list = new Array<APINode>();
            apiMap.set(an.mod, list);
        }
        list.push(an);
    }

    for (let [k, list] of apiMap) {
        let data: any = {};
        for (let an of list) {
            {
                let [prop, red] = getProperties(an.req.args);
                let reqName = `${an.mod}/${an.name}/req`;
                data[reqName] = {
                    comment: an.req.comment,
                    $id: reqName,
                    properties: prop,
                    required: red
                };
            }

            {
                let [prop, red] = getProperties(an.res.args);
                let resName = `${an.mod}/${an.name}/resp`;
                data[resName] = {
                    comment: an.res.comment,
                    $id: resName,
                    properties: prop,
                    required: red
                }
            }
        }
    }
}


function getProperties(args: VarNode[]) {

    return [{}, []];
}