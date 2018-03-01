# unthink
> 一个可自由扩展的协议代码生成器
## __安装__
```
npm install unthink -g
```

## __使用__

> 创建一个存放协议描述文件的目录，执行如下操作  
```
unthink init
```

> 会生成如下目录树:

- `config.json`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---配置文件
- `start.cmd`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---执行命令的批处理                   
- client_only&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---只对客户端做代码输出    
    - `api.json` 
    - `enum.json`
    - `struct.json`
- common&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---客户端服务器同时输出
    - `api.json`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---协议接口描述文件，以下统称`interface`文件   
    - `enum.json`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---通用枚举描述文件，以下统称`interface`文件   
    - `struct.json`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---通用数据结构描述文件,以下统称`interface`文件   
- server_only&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;---只对服务器做代码输出     
    - `api.json`    
    - `enum.json`  
    - `struct.json`          

> `common`目录下描述的内容客户端和服务器代码都会导出，`client_only`描述的内容只有客户端代码会导出,  
> `server_only`描述的内容只有服务器会导出。`client_only`和`server_only`在一般场景中不会用到。  
> `client_only`设计意图是在服务器本身内置了一部分接口功能，但是没有或者没有必要提供客户端接口，  
> 这时候可以在`client_only`文件中补充描述，`server_only`目录功能类似。

## __执行代码生成__ 

> 配置`config.json`代码路径，执行`start.cmd`生成代码。

## __协议版本号介绍__

> 工具会自动记录协议版本号，提供给游戏逻辑做协议版本校验  
> 版本号是以一个枚举提供的，在工具中自动生成，不需要描述文件添加，ts代码格式如下：
``` typescript
export class ProtoVersion { //工具自动生成的枚举，记录协议版本号
    static versionCode = 2; //协议版本号数字表示
    static versionName = '0.0.2'; //协议版本号字符表示
}
```
>同时在`interface`根目录下生成一个version文件用来记录老的代码，内容如下:
``` json
{
  "versionCode": 2,
  "versionName": "0.0.2",
  "versionMD5": "1299e5e90d906a07685a9d7e53b28b2f"
}
```
>`versionName`记录了版本号的字符表示，每10个小版本会提升一个大版本。可以手动修改此文件来矫正版本号提升。  
>`versionMD5`字段是所有`interface`文件字符计算出的md5，并且过滤掉了注释，只是修改注释，并不会导致版本号提升。



## __文件格式介绍__

### __`config.json`__

> __`注意`__：本项目下的所有json文件都支持注释，如果使用`vscode`编辑，建议右下角文件类型由`JSON`切换至`JSON with Comments`。可以消除红线错误提示。高于1.20版本有这个文件类型。  
>`config`完整内容如下:  

``` json
{
    "out": { /* 需要输出的文件种类，对应backend的种类*/
        "unity": "./out/unity", /*unity工程Scripts目录*/
        "unity-gameframework": { /*使用gameframework工程的Scripts目录*/
            "path": "./out/unity-gfw/Assets/Scripts", /*unity工程Script目录*/
            "namespace": "StarForce"
        },
        "thinkjs": "./out/thinkjs/", /*thinkjs 项目根目录*/
        "json-schema": "./out/thinkjs/public/schema", /*json-schema目录*/
        "sql": {
            "path": "./out/thinkjs/public/sql/",
            "dbname": "gamedb"
        }
    },
    "request_required": true, /*是否坚持每个api声明了request*/
    "response_required": true  /*是否坚持每个api声明了response*/
}
```
+ `out` 属性配置了所有支持的导出，可以删掉不需要的导出
    + `unity` 提供了原生unity的协议导出，并且提供了一个简单的http封装`ServerContext.cs`,这个文件可以手动修改，不会被工具再次生成覆盖。
    + `unity-gameframework` 提供了基于技术中心提供的gameframework框架的协议导出，框架包含了事件机制，请求顺序化机制等，详细介绍请阅读框架文档。`namespace`是生成代码的命名空间。
    + `thinkjs` thinkjs服务器框架导出的协议文件，并且会在对应的controller文件中做处理函数声明。controller部分的修改是借助于于`typescript`抽象语法树的分析修改，不会影响现有逻辑的实现。
    + `json-schema` 是http请求参数的json格式校验，生成的描述文件符合json-schema标准，可以使用`ajv`或者中心提供的`think-game-validator`模块来校验。
    + `sql`所有`interface`文件中声明的结构，如果是需要存数据库的，会生成一份数据库DDL文件，直接通过phpadmin或者其他工具导入该文件，即可完成数据库的更新。做到了完全不需要手动操作数据库的效果。
+ `request_required` 是否允许单方向协议接口，http必须是双向的，一个req对应一个res，在长连接协议中，可能不是对应的。该字段留给后续扩展，暂时全部为true。
+ `response_required` 同上。  

## __协议内置类型及关键字介绍__

### __内置类型__
|类型|名称|默认值|DB默认类型|说明|
|:---|:---|:---|:---|:---|
|`bool`|布尔型|false|tinyint(4)||
|`string`|字符串|“”|varchar(64)||
|`int`|int|0|int(11)|区分各种数字类型是考虑到c#类型和db类型，js统一为number|
|`int64`|64位int|0|bigint(20)|同上|
|`float`|浮点型|0.0|float|同上|
|`double`|双精度浮点型|0.0|double|同上|
|`array`|数组|null|text(json字符串)|数组支持嵌套|
|`object`|对象|null|text(json字符串)|对象类型和自定义类型区别是，对象的属性是动态的|


### __关键字__
|名称|效果|说明|可省略|
|:---|:---|:---|:---|
|`<type>`|指定变量的类型|可以是上表的内置类型或者自定义结构或者是纯数字枚举（当做int处理）||
|`<default>`|指定变量的默认值|需要用户自己保证默认值在各种语言导出版本中语法正确，不指定采用内置默认值|&radic;|
|`<dbtype>`|指定变量对应的db类型|当内置默认类型不能满足需求的时候指定对应的默认值|&radic;|
|`<nodb>`|强制使继承DBObject对象的结构不导出到sql文件DDL中|某个中间类，不需要sql中对其建表的时候使用|&radic;|
|`<dbindex>`|如果结构存库，指定对应表的索引|子类会覆盖父类指定的索引|&radic;|
|`<extends>`|指定结构继承的父类|只支持单继承|&radic;|
|`<req>`|接口声明中request参数|http中是必须的||
|`<res>`|接口声明中require参数|http中是必须的||

> 下面`interface`文件会详细提供语法举例。


### __`enum.json`__
> __`注意`__：本项目所有的注释，直接在对应需要注释的对象后面使用 `//`形式编写。  
> 举例如下:
```  json
{
    "EItemState": { //物品状态
        "normal": 0, //正常状态
        "locked": 1, //被锁定
        "countdown": 2, //冷却中
    },
   "ECommon": { // 通用枚举
        "MaxNameLenth": 20, //名字最大长度
        "DefaultName": "Brad Pitt", // 默认名字
        "MoveSpeed": 1.3, // 移动速度
        "CanJump": false // 开启跳跃
    }   
},
```
> 以上声明了两种枚举，一种是纯数字枚举`EItemState`，这种枚举可以作为类型提供给其他变量使用（当做int类型）。另外一种是数字，浮点，字符串或者布尔型混合的枚举`ECommon`，这种枚举是用静态`class`实现的,不能作为类型给其他变量使用。  

### __`struct.json`__
#### 普通结构声明：
``` json
    "RewardItem": // 奖励使用的物品结构
    {
        "cid":"int",
        "count":"int",
    },
    "Reward":
    {
        "gold":"int", // 奖励的金币
        "items":"array<RewardItem>", //奖励的物品数组
        "id":{     //对应的关卡id
            "<type>":"int",// 类型
            "<default>":"123" // 默认值，可以不写这个属性，默认值是安装前面表格的默认值
        }
    }
```
>可以看到 `Reward` 和`RewardItem`是结构名，定义结构不用区分先后顺序。`Reward`有三个成员： `gold`,`items`,`id`。
+ `gold`是用简便方法声明的,
+ `id`是用详细语法声明的。详细声明方法中`<type>`是必须的，`<default>`是可以省略的，
+ `items`是一个数组并且成员类型是我们自己定义的类型。还可以给`id`添加`<dbtype>`描述数据库存储格式，当然要求`Reward`对象必须声明成存储在数据库中的对象，下面会介绍语法。
> __`注意`__：关于简便语法和详细语法，起到的作用是一样的，只是详细语法可以更详细的指定一些属性，比如`<default>`:默认值,`<dbtype>`:对应的数据库表的字段类型。如果不用详细语法指定，会使用工具内置默认值，参见前面的关键字表格。建议使用简易描述所有结构，节省开发时间。在特殊需求的地方或者上线前的优化过程中，使用详细描述。

#### 数据库结构声明：
>这个功能是可选的，如果需要自由的控制对象的存库行为，不导出sql文件。这个功能可以跳过。  
>首先明确一个设计概念，`struct.json`的一个结构 对应了一条玩家数据（或者非玩家数据，如公会信息），同时对应了数据库中的一张表，这三个是一一对应的，结构名和玩家数据类型和数据库表名是一致的。 
>工具内置了3个相关结构：
``` json
    "DBBase": { // 所有入库对象应该继承此类 
    },
    "DBObject": { // 所有玩家个人数据应该继承此类。
        "<extends>": "DBBase",
        "<nodb>": true,
        "<dbindex>": "PRIMARY KEY (`uuid`),KEY `USRID` (`usrid`)",
        "uuid": "string",
        "usrid": "int64"
    },
    "DBGlobalObject": { // 所有全局数据应该继承此类（例如公会）。
        "<extends>": "DBBase",
        "<nodb>": true,
        "<dbindex>": "PRIMARY KEY (`uuid`)",
        "uuid": "string",
    },
```
+ `DBBase`,继承该结构的所有结构，如果没有指定`<nodb>`那么都会在数据库生成一张对应表格。
+ `DBObject`所有玩家所属对象的基类，比如物品对象，任务对象等等。带有两个字段`uuid`和`usrid`，
一个是该对象的唯一id，一个是玩家id。`<dbindex>`描述了对应索引，如果某个表有特殊的索引要求，可以拥有自己的`<dbindex>`
+ `DBGlobalObject` 是全局对象的基类，比如公会表。
>以上结构除了`DBBase`的结构名不能修改(判断是否导出数据库表的依据)，其他都可以根据需求修改
>下面是举例
``` json
     "Item": { // 玩家物品的结构
        "<extends>": "DBObject",
        "cid":"int",//对应的策划表id
        "count":"int", // 物品的数量
        "state":"EItemState" // 对应物品的状态。 
    },
    "Task": {
        "<extends>": "DBObject",
        "cid":"int",
        "phase":"int" // 或者定义一个对应枚举
    }
```
>`Item`,`Task`代表玩家的物品和任务数据，数据库中会对应生成一下sql的DDL

``` sql
     DROP TABLE IF EXISTS `Item`;
     CREATE TABLE IF NOT EXISTS `Item` (
       `uuid` varchar(64) NOT NULL,
       `usrid` bigint(20) NOT NULL,
       `cid` int(11) NOT NULL COMMENT '对应的策划表id',
       `count` int(11) NOT NULL COMMENT ' 物品的数量',
       `state` text NOT NULL COMMENT ' 对应物品的状态。 ',
       PRIMARY KEY (`uuid`),KEY `USRID` (`usrid`)  
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT=' 玩家物品的结构';
     
     
     DROP TABLE IF EXISTS `Task`;
     CREATE TABLE IF NOT EXISTS `Task` (
       `uuid` varchar(64) NOT NULL,
       `usrid` bigint(20) NOT NULL,
       `cid` int(11) NOT NULL,
       `phase` int(11) NOT NULL COMMENT ' 或者定义一个对应枚举',
       PRIMARY KEY (`uuid`),KEY `USRID` (`usrid`)  
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

```

>如果是中文注释，注意导入时的编码格式，命令行导入可能需要指定编码`--default-character-set=utf8`  
>另外中心仓库提供了一个unthink模块：`think-game-unthink`，封装了玩家数据操作api,实现了玩家数据的加载，缓存（reids）和落地功能，结合该模块，可以让服务器开发只关注于编写逻辑。

### __`api.json`__
>描述客户端和服务器通讯接口的文件。
>格式如下:
``` json
     "System": { // System模块
        "login": { // 玩家登陆api
            "<req>": { // 请求登陆
                "name": "string",
                "pwd": "string"
            },
            "<res>": {
                "usr": "UserInfo", // 玩家信息（需要在结构描述文件中提前定义）
                "error": "EError" //错误类型（需要在枚举文件中提前定义）
            }
        },
        "Logout": { //玩家登出api
            "<req>": {},
            "<res>": {
                "error": "EError"
            }
        }
    },
    "Test": { // 测试模块
        "Echo": { // 回显
            "<req>": {
                "msg": "string", // 回显消息
                "time": "int" //时间戳
            },
            "<res>": {
                "msg": "string", //客户端发来的消息
                "time": "int" //客户端发来的时间戳
            }
        }
    }
```
>`System`和`Test`是模块名，建议不同的游戏模块采用不同的名字，`login`是`System`模块下的一个api，统一模块下可以声明多个api。比如`login`有`<req>`和`<res>`对应了http的`req`和`res`;


### __`扩展`__
>如果该工具不能满足项目需求，可以从gi上获取源码进行修改，源码`res`目录就是`interface`的目录
>`lib/backend`文件夹下是各种代码的输出逻辑，可以根据需求新增代码输出和修改已有的输出。

## __`结束`__
