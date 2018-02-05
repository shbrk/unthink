/*
 * @Author: shenzhengyi 
 * @Date: 2018-01-31 14:04:55 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-02 15:03:34
 */

export class VarNode {
    name: string;
    comment: string | null;
    type: string;
    subtype: Array<string>;
    value: string | null;
};

export class EnumNode {
    name: string;
    comment: string | null;
    members: Array<VarNode>;
    ismix: boolean;
};


export class StructNode {
    name: string;
    comment: string | null;
    members: Array<VarNode>;
    base: string;
};


export class ReqNode {
    comment: string | null;
    args: Array<VarNode>;
};

export class ResNode {
    comment: string | null;
    args: Array<VarNode>;
};

export class APINode {
    name: string;
    comment: string | null;
    mod: string;
    req: ReqNode;
    res: ResNode;
};

export enum OUTTAG {
    common,
    client,
    server,
};

export enum FILETAG {
    Enum,
    Struct,
    API,
};


