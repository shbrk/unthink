import { OUTTAG, EnumNode, StructNode, APINode, VarNode } from "./astnode";


export default class TypeChecker {
    ast: any;
    constructor(ast: any) {
        this.ast = ast;
    }

    findTypeOrThrow(t: string, tag: OUTTAG) {
        if (this.ast.findTypeBuildin(t)) return true;
        let en: EnumNode = this.ast.findTypeEnum(t, tag);
        if (en) {
            if (en.ismix) throw new Error(`${en.name} cannot not be variable type`);
            return true;
        }
        if (this.ast.findTypeStruct(t, tag)) return true;
        throw new Error(`cannot find type:${t} define`)
    }

    typeCheckOrThrow() {
        this.typeCheckRaw(this.ast.structMapCommon, this.ast.apiMapCommon, OUTTAG.common);
        this.typeCheckRaw(this.ast.structMapClientOnly, this.ast.apiMapClientOnly, OUTTAG.client);
        this.typeCheckRaw(this.ast.structMapServerOnly, this.ast.apiMapServerOnly, OUTTAG.server);
    }

    // 全部类型解析结束才能判断自定义类型，对枚举追加默认值
    defaultValueAdd(vn: VarNode) {
        if (vn.value == null) {
            let en = this.ast.findTypeEnum(vn.type);
            if (en && !en.ismix) vn.value = '0';
        }
    }

    typeCheckRaw(structMap: Map<string, StructNode>, apiMap: Map<string, APINode>, tag: OUTTAG) {
        for (let sn of structMap.values()) {
            if (sn.base) this.findTypeOrThrow(sn.base, tag)
            for (let vn of sn.members) {
                this.findTypeOrThrow(vn.type, tag);
                this.defaultValueAdd(vn);
                for (let t of vn.subtype) {
                    this.findTypeOrThrow(t, tag)
                }
            }
        }

        for (let an of apiMap.values()) {
            if (an.req) {
                for (let vn of an.req.args) {
                    this.findTypeOrThrow(vn.type, tag);
                    this.defaultValueAdd(vn);
                    for (let t of vn.subtype) {
                        this.findTypeOrThrow(t, tag)
                    }
                }
            }

            if (an.res) {
                for (let vn of an.res.args) {
                    this.findTypeOrThrow(vn.type, tag);
                    this.defaultValueAdd(vn);
                    for (let t of vn.subtype) {
                        this.findTypeOrThrow(t, tag)
                    }
                }
            }
        }

    }
}


