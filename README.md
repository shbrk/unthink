安装
==
> `npm install unthink -g`

初始化
==
> 选择任意目录 执行 `unthink init` ，会在当前目录生成协议描述文件模板。

生成目标代码
==
> 修改`config.json` 配置文件中的`out`属性，指定代码生成路径。
> 运行 `unthink run` 命令 或者直接双击 `start.cmd` 执行代码生成。



协议生成器介绍。
==
> 包含`enum.json` `struct.json` `api.json` 三个描述文件

enum.json
===
>描述前后端通用枚举，例如：错误类型，任务种类。注释会保留.

>源码：可以包含字符串和数字的混合枚举
``` js
{
    "EError":// 错误提示
    {
     "ServerError":1,//服务器错误
    "DataError":1,
    "ClientError":2
    },
    "ECommon":
    {
         "key":"abccc",//key
        "maxTask":20,
    }
}
```
>生成c#代码：
``` csharp
public enum EError // 错误提示
{
    ServerError = 1,//服务器错误
    DataError = 2,
    ClientError = 3
}

public class ECommon
{
    public static string key = "abcccc";//key
    public static int maxTask = 20;
}

```

>生成ts代码
``` typescript
export enum EError // 错误提示
{
    ServerError = 1,
    DataError = 2,
    ClientError = 3
};
export enum ECommon
{
    key = "abcccc",//key
    maxTask = 20
};
```

struct.json
===
>前后端通用的数据结构，支持单继承。类型提供 `int` `float` `string` `array`  `object` 声明继承特定基类 `DBOBJECT`的数据类型，会自动创建数据库结构，生成sql文件。数据库相关生成和其他功能是解耦的。
>源码：
``` js
{
  "DBOBJECT": { // 所有入库对象应该继承此类 
    },
    "Item": {
        "cid": "int",
        "count": "int"
    },
    "UserInfo": {
        "<extend>": "DBOBJECT",
        "name": "string", // 玩家姓名
        "level": "int",
        "items": "Array<Item>",
        "luck": "float",
        "info": { // 自定义格式
            "<type>": "string",
            "<dbType>": "text",
            "<default>": "abc"
        }
    }
}
```
> 属性定义可以像`UserInfo.name` 一样提供简洁描述，也可以像`UserInfo.info`一样指定对应的mysql类型和默认值。建议开发期做简洁描述，上线前细化数据库类型，添加表索引等DB优化操作。

> 生成c#代码
```csharp
    [Serializable]
    public class DBOBJECT
    {
    }
    [Serializable]
    public class Item:
    {
        public int cid;
        public int count;
    }
    [Serializable]
    public class UserInfo : DBOBJECT
    {
        public string name;
        public int level;
        public List<Item> items;
        public float luck;
        public string info = "abc";
    }
```
> 生成ts代码
```typescript
export class DBOBJECT {
}
export class Item {
    cid:number;
    cid:count;
}
export class UserInfo extends DBOBJECT {
    name:string;
    level:number;
    items:Array<Item> items;
    luck:number;
    info:string = "abc";
}
```
> 在服务器数据库查询时 可以提供类型支持
```typescript
async indexAction() {
    let user = this.model("UserInfo");
    let ret = await user.select() as Array<UserInfo>;
    let name = ret[0].name
    this.success(ret[0]);
  }
```
api.json   
===

> 描述前后端协议 request和response 成对出现,变量名可以用前面定义的数据结构 和 非字符串枚举。

> 源码：
```js
{
    "System": { // 模块
        "Login": { // 玩家登陆
            "<req>": { // 请求登陆
                "name": "string",
                "pwd": "string"
            },
            "<res>": {
                "usr": "UserInfo",
                "error":"EError"
            }
        }
    }
}
```
>生成c# 
```csharp
public class SystemPxy
{
    public static ServerResponse<SystemLoginRes> Login(string name, string pwd)
    {
        var url = ServerContext.UrlPathJoin("System", "Login");
        JObject obj = new JObject();
        obj["name"] = name;
        obj["num"] = num;
        return new ServerResponse<SystemLoginRes>(url,JsonConvert.SerializeObject(obj));
    }
}
```
> c#版封装了一个协程函数，可以如下进行简洁实现一个请求
```csharp
var res = SystemPxy.Login("abc", "444");
yield return res.Wait();
Debug.Log(res.result.usr);
```

>生成ts
```typescript
 async loginAction() {
    let name = <string> this.post('name');
    let pwd = <string> this.post('pwd');
  }
}
```
>会自动生成controller 并且在对应函数中，插入声明变量，不会覆盖已有代码

>额外会生成一份符合`json-schema`的描述文件，调用已有的验证中间件进行json格式验证