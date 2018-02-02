import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';
import AST from '../../ast';
import { EnumNode, StructNode, VarNode, OUTTAG, APINode } from '../../astnode';


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

    parseVar(vn: VarNode) {
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
                let [t, val] = this.parseVar(vn);
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
        this.render(fileName, ejsName, data);
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
                let [t, val] = this.parseVar(vn);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.mems.push(v);
            }
            data.structs.push(node);
        }
        this.render(fileName, ejsName, data);
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
            node.req = {};
            node.req.comment = this.parseComment(an.req.comment);
            node.req.args = [];
            node.reqArgs = '';
            for (let vn of an.req.args) {
                let [t, val] = this.parseVar(vn);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.req.args.push(v);
                node.reqArgs = `${node.reqArgs}, ${v.type} ${v.name}`;
            }
            if (node.reqArgs.length > 2) node.reqArgs = node.reqArgs.substr(2);

            node.res = {};
            node.res.comment = this.parseComment(an.res.comment);
            node.res.args = [];
            for (let vn of an.res.args) {
                let [t, val] = this.parseVar(vn);
                let v: any = {};
                v.name = vn.name;
                v.type = t;
                v.value = val;
                v.comment = this.parseComment(vn.comment);
                node.res.args.push(v);
            }
            list.push(node);
        }
        this.render(fileName, ejsName, data);
    }

    render(fileName: string, ejsName: string, data: {}) {
        let ejsFilePath = path.join(this.ejsPath, ejsName);
        let temp = fs.readFileSync(ejsFilePath, { encoding: 'utf-8' });
        let content = ejs.render(temp, data, { compileDebug: true });
        let outFilePath = path.join(this.outPath, fileName)
        fs.writeFileSync(outFilePath, content, { encoding: 'utf-8' });
    }
}