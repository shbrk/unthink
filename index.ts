import AST from "./lib/ast";
import * as path from 'path';
import { requireJsonNoComment } from "./lib/json";
import * as fs from "fs";
import { try2mkdir } from "./lib/helper";
import { OUTTAG } from "./lib/astnode";
import { midProcess } from "./lib/midprocess";

const relativePath = path.relative(process.cwd(), __dirname);
const resPath = relativePath == 'dist' ? './res/' : process.cwd(); // 判断是否是调试模式
const curPath = path.join(__dirname, '../');

const config = requireJsonNoComment(path.join(resPath, 'config.json'));

config.out = config.out || [];
config.request_required = config.request_required || false;
config.response_required = config.response_required || false;


function createAST(config: any) {
    let ast = new AST(config);

    ast.addEnum(path.join(resPath, 'common/enum.json'));
    ast.addEnum(path.join(resPath, 'server_only/enum.json'), OUTTAG.server);
    ast.addEnum(path.join(resPath, 'client_only/enum.json'), OUTTAG.client);

    ast.addStruct(path.join(resPath, 'common/struct.json'));
    ast.addStruct(path.join(resPath, 'server_only/struct.json'), OUTTAG.server);
    ast.addStruct(path.join(resPath, 'client_only/struct.json'), OUTTAG.client);

    ast.addAPI(path.join(resPath, 'common/api.json'));
    ast.addAPI(path.join(resPath, 'server_only/api.json'), OUTTAG.server);
    ast.addAPI(path.join(resPath, 'client_only/api.json'), OUTTAG.client);

    ast.typeCheck();
    return ast;
}

function supplement(ast: AST) {
    midProcess(ast,resPath);
}

function output(ast: AST, list: any) {
    let ejsPath = path.resolve(curPath, './ejs');
    for (let conf in list) {
        require(`./lib/backend/${conf}`).default(ast, list[conf], ejsPath);
    }
}

console.log('');
let ast = createAST(config);
supplement(ast);
output(ast, config.out);
console.log('');
console.log('done!');

