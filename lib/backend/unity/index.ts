/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:31 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-08 19:03:59
 */

import AST from "../../ast";
import * as path from 'path';
import * as fs from 'fs';
import CSharpOutput from "../common/csharp";
import { try2mkdir, render } from "../../helper";

export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    outPath = path.join(outPath, 'Protocol');
    ejsPath = path.join(ejsPath, 'csharp');
    let cs = new CSharpOutput(ast, outPath, ejsPath);
    cs.doOutput();

    let outName = 'ServerContext.cs';
    let ejsName = 'context.ejs';
    let outFile = path.join(outPath, outName);
    let ejsFile = path.join(ejsPath, ejsName);
    if (!fs.existsSync(outFile)) render(outName, ejsName, {}, ejsPath, outPath);
}