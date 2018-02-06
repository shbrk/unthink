import * as path from 'path';
import * as fs from 'fs';
import AST from '../../ast';
import { EnumNode, StructNode, VarNode, OUTTAG, APINode, FILETAG } from '../../astnode';
import { render } from '../../helper';


export default class BaseOutput {
    outPath: string;
    ejsPath: string;
    ast: AST;

    constructor(ast: AST, outPath: string, ejsPath: string) {
        this.outPath = outPath;
        this.ejsPath = ejsPath;
        this.ast = ast;
    }

    doOutput() {
    }

    parseComment(comment: string | null) {
        return comment ? `//${comment}` : '';
    }

    parseExtends(base: string | null) {
        return base ? ` extends ${base}` : '';
    }

    parseVar(vn: VarNode, ft: FILETAG) {
        return [vn.type, vn.value];
    }

    enumOutput(map: Map<string, EnumNode>, fileName: string, ejsName: string) {
        let data: any = {};
        data.enums = [];
        data.enums_mix = [];
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let en of map.values()) {
            let node: any = {};
            node.name = en.name;
            node.comment = this.parseComment(en.comment);
            node.mems = [];
            for (let vn of en.members) {
                let [t, val] = this.parseVar(vn, FILETAG.Enum);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.mems.push(v);
            }
            if (en.ismix)
                data.enums_mix.push(node);
            else
                data.enums.push(node);
        }
        render(fileName, ejsName, data, this.ejsPath, this.outPath);
    }


    structOutput(map: Map<string, StructNode>, fileName: string, ejsName: string) {
        let data: any = {};
        data.structs = [];
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let sn of map.values()) {
            let node: any = {};
            node.name = sn.name;
            node.comment = this.parseComment(sn.comment);
            node.mems = [];
            node.base = this.parseExtends(sn.base);
            for (let vn of sn.members) {
                let [t, val] = this.parseVar(vn, FILETAG.Struct);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.mems.push(v);
            }
            data.structs.push(node);
        }
        render(fileName, ejsName, data, this.ejsPath, this.outPath);
    }

    apiOutput(map: Map<string, APINode>, fileName: string, ejsName: string) {
        let data: any = {};
        data.apis = new Map<string, Array<any>>();
        let now = new Date();
        data.time = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        for (let an of map.values()) {
            let list = data.apis.get(an.mod)
            if (!list) {
                list = new Array<any>();
                data.apis.set(an.mod, list);
            }

            let node: any = {};
            node.name = an.name;
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
}