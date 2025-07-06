# TK - Tampermonkey 模块化框架

这是一个用于 Tampermonkey 脚本模块化开发的 GitHub 仓库。

## 目录结构

- `main.user.js`：油猴主入口脚本（框架核心）
- `modules/`：放置功能模块
  - `logger.js`：日志输出模块

## 功能特点

- 模块化设计，便于维护和扩展
- 通过 GitHub 远程加载模块
- 使用 JSDoc 规范的代码注释
- 支持热更新（修改模块后刷新页面即可）
- 实时加载 GitHub 脚本
- 完整的模块管理系统
- 钩子系统支持功能扩展
- 内置日志模块（支持彩色输出）

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

### 模块开发示例

```javascript
// myModule.js
const myModule = {
    init() {
        // 模块初始化代码
    },
    
    someFunction() {
        // 功能实现
    }
};

// 注册模块
window.TK.moduleManager.register('myModule', myModule);
```

### 使用钩子系统

```javascript
// 添加钩子
window.TK.moduleManager.addHook('init', (data) => {
    console.log('框架初始化完成', data);
});

// 触发钩子
window.TK.moduleManager.triggerHook('customEvent', { some: 'data' });
```

### 加载 GitHub 脚本

```javascript
// 异步加载脚本
async function loadMyScript() {
    try {
        const content = await window.TK.scriptLoader.loadScript(
            'https://raw.githubusercontent.com/user/repo/main/script.js'
        );
        // 处理脚本内容
    } catch (error) {
        console.error('加载失败:', error);
    }
}
```

## 版本历史

### v0.2
- 添加实时 GitHub 脚本加载支持
- 实现模块管理系统
- 添加钩子系统
- 优化框架初始化流程
- 导出全局 TK 对象

### v0.1
- 初始版本
- 实现基础框架
- 添加 logger 模块 