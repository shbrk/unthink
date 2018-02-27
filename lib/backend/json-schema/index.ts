/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:24 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-27 20:19:49
 */

import AST from "../../ast";
import { OUTTAG, APINode, VarNode } from "../../astnode";
import * as fs from 'fs';
import * as path from 'path';
import { render } from "../../helper";
import { ETYPE } from "../../types";

let typeTable: any = {};
typeTable[ETYPE.ARRAY] = 'array';
typeTable[ETYPE.BOOL] = 'boolean';
typeTable[ETYPE.DOUBLE] = 'number';
typeTable[ETYPE.FLOAT] = 'number';
typeTable[ETYPE.INT] = 'number';
typeTable[ETYPE.INT64] = 'number';
typeTable[ETYPE.STRING] = 'string';
typeTable[ETYPE.OBJECT] = 'object';


export default function (ast: AST, outPath: string, ejsPath: string) {
    ejsPath = path.join(ejsPath, 'json-schema');

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
                let [prop, red] = getProperties(an.req.args, ast);
                let reqName = `${an.mod}/${an.name}/req`;
                data[reqName] = {
                    comment: an.req.comment,
                    $id: reqName,
                    properties: prop,
                    required: red
                };
            }

            {
                let [prop, red] = getProperties(an.res.args, ast);
                let resName = `${an.mod}/${an.name}/resp`;
                data[resName] = {
                    comment: an.res.comment,
                    $id: resName,
                    properties: prop,
                    required: red
                }
            }
        }
        render(`${k}.json`, 'json-schema.ejs', { content: JSON.stringify(data, null, '  ') }, ejsPath, outPath);
    }
}

function generate(args: VarNode[], ast: AST, properties: any = {}) {
    for (let vn of args) {
        if (vn.type == ETYPE.ARRAY) {
            let prop: any = {};
            for (let subt of vn.subtype) {
                let localProp: any = {};
                if (subt == ETYPE.ARRAY) {
                    prop.type = "array";
                    prop.items = localProp;
                    prop = localProp;
                }
                else if (typeTable[subt]) {
                    prop.type = typeTable[subt];
                }
                else {
                    let en = ast.findTypeEnum(subt, OUTTAG.server);
                    if (en) { prop.type = "number"; }
                    let sn = ast.findTypeStruct(subt, OUTTAG.server)
                    if (sn) {
                        prop.type = "object";
                        prop.properties = {};
                        generate(sn.members, ast, prop.properties);
                    }
                }
            }
            properties[vn.name] = {
                type: "array",
                items: prop
            }
        }
        else if (typeTable[vn.type]) {
            properties[vn.name] = {
                type: typeTable[vn.type]
            }
        }
        else {
            let en = ast.findTypeEnum(vn.type, OUTTAG.server);
            if (en) { properties[vn.name] = { type: "number" }; }
            let sn = ast.findTypeStruct(vn.type, OUTTAG.server)
            if (sn) {
                properties[vn.name] = {
                    type: "object",
                    properties: {}
                }
                generate(sn.members, ast, properties[vn.name].properties);
            }
        }
    }
    return properties;
}

function getProperties(args: VarNode[], ast: AST) {
    let properties: any = {};
    let red: string[] = [];
    for (let vn of args) {
        red.push(vn.name);
    }
    generate(args, ast, properties);
    return [properties, red];
}