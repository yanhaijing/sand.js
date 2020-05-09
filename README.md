# [sand.js](https://github.com/yanhaijing/sand.js)
[![](https://img.shields.io/badge/Powered%20by-jslib%20base-brightgreen.svg)](https://github.com/yanhaijing/jslib-base)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/yanhaijing/sand.js/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/yanhaijing/sand.js.svg?branch=master)](https://travis-ci.org/yanhaijing/sand.js)
[![Coveralls](https://img.shields.io/coveralls/yanhaijing/sand.js.svg)](https://coveralls.io/github/yanhaijing/sand.js)
[![npm](https://img.shields.io/badge/npm-0.1.0-orange.svg)](https://www.npmjs.com/package/sandjs)
[![NPM downloads](http://img.shields.io/npm/dm/sand.js.svg?style=flat-square)](http://www.npmtrends.com/sandjs)
[![Percentage of issues still open](http://isitmaintained.com/badge/open/yanhaijing/sand.js.svg)](http://isitmaintained.com/project/yanhaijing/sand.js "Percentage of issues still open")

Build the world with sand.js, a UI framework like reactjs

## :star: 特性

- 支持组件，支持生命周期函数
- 支持函数式组件，支持hook函数
- 支持fragment，支持render返回数组
- 支持JSX
- diff过程可中断，不阻塞
- 兼容IE8

> 注意: 如果不同时使用 `export` 与 `export default` 可打开 `legacy模式`，`legacy模式` 下的模块系统可以兼容 `ie6-8`，见rollup配置文件

## :pill: 兼容性
单元测试保证支持如下环境：

| IE   | CH   | FF   | SF   | OP   | IOS  | Android   | Node  |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ----- |
| 6+   | 29+ | 55+  | 9+   | 50+  | 9+   | 4+   | 4+ |

**注意：编译代码依赖ES5环境，对于ie6-8需要引入[es5-shim](http://github.com/es-shims/es5-shim/)才可以兼容，可以查看[demo/demo-global.html](./demo/demo-global.html)中的例子**

## :open_file_folder: 目录介绍

```
.
├── demo 使用demo
├── dist 编译产出代码
├── doc 项目文档
├── src 源代码目录
├── test 单元测试
├── CHANGELOG.md 变更日志
└── TODO.md 计划功能
```

## :rocket: 使用者指南

通过npm下载安装代码

```bash
$ npm install --save sandjs
```

如果你是webpack等环境

```js
import {Component, render, createElement} from 'sandjs';
```

如果你是浏览器环境

```html
<script src="node_modules/sandjs/dist/index.aio.js"></script>
<script>
    const {Component, render, createElement} = sandjs;
</script>
```

## 入门文档

自定义+渲染一个组件

```js
import {Component, render, createElement} from 'sandjs';

class MyC extends Component {
    constructor(props) {
        super(props);
        this.state = { number: 1 };

        this.onAdd = this.onAdd.bind(this);
    }
    onAdd() {
        this.setState({
            number: this.state.number + 1,
        });
    }
    render() {
        const { number } = this.state;
        return createElement(
            "div",
            null,
            [
                createElement("span", null, ["hello"]),
                createElement("span", null, [number]),
                createElement("div", null, [
                    createElement(
                        "button",
                        { onClick: this.onAdd },
                        ["增加"]
                    ),
                ]),
            ]
        );
    }
}

render(
    createElement(MyC, null, []),
    document.getElementById("container")
);
```
## :bookmark_tabs: 文档
[API](./doc/api.md)

## :kissing_heart: 贡献者指南
首次运行需要先安装依赖

```bash
$ yarn
```

一键打包生成生产代码

```bash
$ yarn build
```

运行单元测试:

```bash
$ yarn test
```

> 注意：浏览器环境需要手动测试，位于`test/browser`

修改 package.json 中的版本号，修改 README.md 中的版本号，修改 CHANGELOG.md，然后发布新版

```bash
$ yarn release
```

将新版本发布到npm

```bash
$ npm publish
```

## 贡献者列表

[contributors](https://github.com/yanhaijing/sand.js/graphs/contributors)

## :gear: 更新日志
[CHANGELOG.md](./CHANGELOG.md)

## :airplane: 计划列表
[TODO.md](./TODO.md)