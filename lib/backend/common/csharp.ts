import AST from "../../ast";
import BaseOutput from "./base";
import { ETYPE } from "../../types";
import { format } from "util";
import { VarNode, OUTTAG, FILETAG, APINode } from "../../astnode";
import { render } from "../../helper";

let typeTable: any = {};
typeTable[ETYPE.ARRAY] = 'List<%s>';
typeTable[ETYPE.BOOL] = 'bool';
typeTable[ETYPE.DOUBLE] = 'double';
typeTable[ETYPE.FLOAT] = 'float';
typeTable[ETYPE.INT] = 'int';
typeTable[ETYPE.INT64] = 'long';
typeTable[ETYPE.OBJECT] = 'object';
typeTable[ETYPE.STRING] = 'string';

let defaultTable: any = {};
defaultTable[ETYPE.ARRAY] = 'null';
defaultTable[ETYPE.BOOL] = 'false';
defaultTable[ETYPE.DOUBLE] = '0.0';
defaultTable[ETYPE.FLOAT] = '0.0f';
defaultTable[ETYPE.INT] = '0';
defaultTable[ETYPE.INT64] = '0';
defaultTable[ETYPE.OBJECT] = 'null';
defaultTable[ETYPE.STRING] = '""';


export default class CSharpOutput extends BaseOutput {

    constructor(ast: AST, outPath: string, ejsPath: string) {
        super(ast, outPath, ejsPath);
    }

    parseExtends(base: string | null) {
        return base ? ` : ${base}` : '';
    }

    getType(t: string, subt: string[]) {
        if (t == ETYPE.ARRAY) {
            let tmp = ([t] as string[]).concat(subt);
            let item = tmp[tmp.length - 1];
            item = typeTable[item] || item;
            for (let i = tmp.length - 1; i > 0; i--) {
                let array = typeTable[tmp[i - 1]]
                item = format(array, item)
            }
            return item;
        }
        else if (typeTable[t]) {
            return typeTable[t];
        }
        else {
            return t;
        }
    }

    getDefaultVal(t: string) {
        if (defaultTable[t])
            return defaultTable[t];
        return 'null';
    }


    parseVar(vn: VarNode, ft: FILETAG) {
        let t = this.getType(vn.type, vn.subtype);
        let val = vn.value;
        if (val == null) val = this.getDefaultVal(vn.type);
        return [t, val];
    }

    switchUpperCase(varName: string) {
        if (varName && varName.length > 0) {
            let prefix = varName.substr(0, 1);
            let rest = varName.substr(1);
            prefix = prefix.toUpperCase();
            return `${prefix}${rest}`;
        }
    }


    apiOutput(map: Map<string, APINode>, fileName: string, ejsName: string) {
        let data: any = {};
        data.apis = new Map<string, Array<any>>();
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let an of map.values()) {
            let list = data.apis.get(this.switchUpperCase(an.mod))
            if (!list) {
                list = new Array<any>();
                data.apis.set(this.switchUpperCase(an.mod), list);
            }

            let node: any = {};
            node.name = an.name;
            node.mod = an.mod;
            node.upperName = this.switchUpperCase(node.name);
            node.comment = this.parseComment(an.comment);
            if (an.req) {
                node.req = {};
                node.req.comment = this.parseComment(an.req.comment);
                node.req.args = [];
                node.reqArgs = '';
                for (let vn of an.req.args) {
                    let [t, val] = this.parseVar(vn, FILETAG.API);
                    let v: any = {};
                    v.name = vn.name;
                    v.type = t;
                    v.value = val;
                    v.comment = this.parseComment(vn.comment);
                    node.req.args.push(v);
                    node.reqArgs = `${node.reqArgs}, ${v.type} ${v.name}`;
                }
                if (node.reqArgs.length > 2) node.reqArgs = node.reqArgs.substr(2);
            }

            if (an.res) {
                node.res = {};
                node.res.comment = this.parseComment(an.res.comment);
                node.res.args = [];
                node.resArgs = '';
                for (let vn of an.res.args) {
                    let [t, val] = this.parseVar(vn, FILETAG.API);
                    let v: any = {};
                    v.name = vn.name;
                    v.type = t;
                    v.value = val;
                    v.comment = this.parseComment(vn.comment);
                    node.res.args.push(v);
                    node.resArgs = `${node.resArgs}, ${v.type} ${v.name}`;
                }
                if (node.resArgs.length > 2) node.resArgs = node.resArgs.substr(2);
            }

            list.push(node);
        }
        render(fileName, ejsName, data, this.ejsPath, this.outPath);
    }


    doOutput(enumOut = true, structOut = true, apiOut = true) {
        if (true) {
            let enumMap = this.ast.getEnumMap(OUTTAG.client);
            this.enumOutput(enumMap, 'SharedEnum.cs', 'csharp_enum.ejs');
        }
        if (true) {
            let structMap = this.ast.getStructMap(OUTTAG.client);
            this.structOutput(structMap, 'SharedStruct.cs', 'csharp_struct.ejs');
        }
        if (true) {
            let apiMap = this.ast.getAPIMap(OUTTAG.client);
            this.apiOutput(apiMap, 'API.cs', 'csharp_api.ejs');
        }
    }
}
