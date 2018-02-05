import AST from "./lib/ast";
import * as path from 'path';
import { requireJsonNoComment } from "./lib/json";
import * as fs from "fs";
import { mkdirSync } from "fs";
import { dirname } from "path";

const relativePath = path.relative(process.cwd(), __dirname);
const resPath = relativePath == 'dist' ? './res/' : process.cwd(); // 判断是否是调试模式
const curPath = path.join(__dirname, '../');

const config = requireJsonNoComment(path.join(resPath, 'config.json'));
function createAST() {
    let ast = new AST();
    ast.addEnum(path.join(resPath, 'common/enum.json'));
    ast.addEnum(path.join(resPath, 'server_only/enum.json'));
    ast.addEnum(path.join(resPath, 'client_only/enum.json'));

    ast.addStruct(path.join(resPath, 'common/struct.json'));
    ast.addStruct(path.join(resPath, 'server_only/struct.json'));
    ast.addStruct(path.join(resPath, 'client_only/struct.json'));

    ast.addAPI(path.join(resPath, 'common/api.json'));
    ast.addAPI(path.join(resPath, 'server_only/api.json'));
    ast.addAPI(path.join(resPath, 'client_only/api.json'));

    ast.typeCheck();
    return ast;
}


function output(ast: AST, list: any) {
    let ejsPath = path.resolve(curPath, './ejs');
    for (let name in list) {
        let outPath = path.resolve(list[name]);
        mkdir(outPath);
        require(`./lib/backend/${name}`).default(ast, outPath, ejsPath);
    }
}

function mkdir(dirpath: string) {
    let list = [dirpath];
    while (true) {
        if (list.length == 0) break;
        let dir = list.pop() as string;
        if (!fs.existsSync(dir)) {
            let parent = path.dirname(dir);
            if (fs.existsSync(parent)) {
                fs.mkdirSync(dir);
            }
            else {
                list.push(dir);
                list.push(parent);
            }
        }
    }
};



let ast = createAST();
output(ast, config.out);
console.log('done!');

