/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-01 17:51:31 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-08 18:42:30
 */

import AST from "../../ast";
import * as path from 'path';
import * as fs from 'fs';
import CSharpOutput from "../common/csharp";
import { try2mkdir } from "../../helper";

export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    outPath = path.join(outPath, 'Protocol');
    ejsPath = path.join(ejsPath, 'csharp');
    let cs = new CSharpOutput(ast, outPath, ejsPath);
    cs.doOutput();

    let outFile = path.join(outPath, 'ServerContext.cs');
    let srcFile = path.join(ejsPath, 'ServerContext.cs');
    try2mkdir(path.dirname(outPath));
    if (!fs.existsSync(outFile)) fs.copyFileSync(srcFile, outFile);
}