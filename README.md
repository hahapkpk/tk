# TK - Tampermonkey 模块化框架1

这是一个用于 Tampermonkey 脚本模块化开发的 GitHub 仓库。

## 目录结构

- `main.user.js`：油猴主入口脚本（加载模块）
- `modules/`：放置功能模块
  - `logger.js`：日志输出模块

## 功能特点

- 模块化设计，便于维护和扩展
- 通过 GitHub 远程加载模块
- 使用 JSDoc 规范的代码注释
- 支持热更新（修改模块后刷新页面即可）

## 安装方法

1. 打开 Tampermonkey
2. 创建新脚本，粘贴 `main.user.js` 中的内容
3. 修改其中的 `@require` 链接为你自己的用户名
4. 保存并运行，即可通过 GitHub 加载模块！

## 开发说明

1. 所有模块都放在 `modules` 目录下
2. 每个模块使用 JSDoc 风格的注释
3. 修改模块后，通过 GitHub Desktop 提交并推送更新
4. 刷新网页即可看到最新效果

## 版本历史

### v0.1
- 初始版本
- 实现基础框架
- 添加 logger 模块 