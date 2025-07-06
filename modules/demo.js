/**
 * 演示模块 - 展示框架基本功能
 * @module demo
 */
const demoModule = {
    /**
     * 模块配置
     */
    config: {
        enabled: true,
        buttonColor: '#4CAF50',
        buttonText: '点击测试'
    },

    /**
     * 初始化模块
     */
    init() {
        // 创建测试按钮
        this.createButton();
        
        // 添加框架初始化完成的钩子
        window.TK.moduleManager.addHook('init', (data) => {
            logger.info('框架初始化完成，当前版本：' + data.version);
            logger.info('已加载模块：' + Array.from(data.modules.keys()).join(', '));
        });
    },

    /**
     * 创建测试按钮
     */
    createButton() {
        const button = document.createElement('button');
        button.textContent = this.config.buttonText;
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: ${this.config.buttonColor};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 9999;
        `;

        button.addEventListener('click', () => {
            this.showDemo();
        });

        document.body.appendChild(button);
        logger.info('测试按钮已创建');
    },

    /**
     * 显示演示信息
     */
    async showDemo() {
        logger.info('开始演示框架功能...');

        // 1. 演示模块管理
        const modules = window.TK.moduleManager.list();
        logger.info('当前已加载模块：' + Array.from(modules.keys()).join(', '));

        // 2. 演示配置存储
        GM_setValue('demoConfig', this.config);
        const savedConfig = GM_getValue('demoConfig');
        logger.info('配置保存/读取测试：', savedConfig);

        // 3. 演示GitHub脚本加载
        try {
            const scriptUrl = 'https://raw.githubusercontent.com/你的用户名/tk/main/modules/logger.js';
            const content = await window.TK.scriptLoader.loadScript(scriptUrl);
            logger.info('脚本加载成功，内容长度：' + content.length);
        } catch (error) {
            logger.error('脚本加载失败：' + error.message);
        }

        // 4. 演示钩子系统
        window.TK.moduleManager.triggerHook('demoTest', {
            time: new Date().toLocaleString(),
            message: '这是一个测试事件'
        });
    }
};

// 注册模块
if (typeof window.TK !== 'undefined') {
    window.TK.moduleManager.register('demo', demoModule);
    demoModule.init();
} else {
    console.error('TK框架未加载！');
} 