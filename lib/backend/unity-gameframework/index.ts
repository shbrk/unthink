/*
 * @Author: shenzhengyi 
 * @Date: 2018-02-08 10:03:14 
 * @Last Modified by: shenzhengyi
 * @Last Modified time: 2018-02-08 18:43:54
 */


import AST from "../../ast";
import CSharpOutput from "../common/csharp";
import GFW from './gfw';
import * as path from 'path';

export default function (ast: AST, conf: any, ejsPath: string) {
    let outPath = typeof conf == 'string' ? conf : conf.path;
    outPath = path.join(outPath,'Net');
    ejsPath = path.join(ejsPath,'unity-gameframework');
    let gfw = new GFW(ast, outPath, ejsPath,conf.namespace || "DefaultNameSpace");
    gfw.doOutput(true, true, true);
}



