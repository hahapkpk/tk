// ==UserScript==
// @name         TK - Tampermonkey模块化框架
// @namespace    https://github.com/cf/tk
// @version      0.2
// @description  一个用于Tampermonkey脚本模块化开发的框架
// @author       cf
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @connect      github.com
// @require      https://raw.githubusercontent.com/hahapkpk/tk/main/modules/logger.js
// @require      https://raw.githubusercontent.com/hahapkpk/tk/main/modules/demo.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 模块管理器类
     */
    class ModuleManager {
        constructor() {
            this.modules = new Map();
            this.hooks = new Map();
            this.initialized = false;
        }

        /**
         * 注册模块
         * @param {string} name - 模块名称
         * @param {object} module - 模块对象
         */
        register(name, module) {
            if (this.modules.has(name)) {
                console.warn(`模块 ${name} 已存在，将被覆盖`);
            }
            this.modules.set(name, module);
            console.info(`模块 ${name} 注册成功`);

            // 如果框架已经初始化，立即初始化新模块
            if (this.initialized && module.init) {
                try {
                    module.init();
                    console.info(`模块 ${name} 初始化成功`);
                } catch (error) {
                    console.error(`模块 ${name} 初始化失败:`, error);
                }
            }
        }

        /**
         * 初始化所有模块
         */
        initializeModules() {
            this.initialized = true;
            this.modules.forEach((module, name) => {
                if (module.init) {
                    try {
                        module.init();
                        console.info(`模块 ${name} 初始化成功`);
                    } catch (error) {
                        console.error(`模块 ${name} 初始化失败:`, error);
                    }
                }
            });
        }

        /**
         * 获取模块
         * @param {string} name - 模块名称
         * @returns {object|null} 模块对象
         */
        get(name) {
            return this.modules.get(name) || null;
        }

        /**
         * 获取所有已注册模块
         * @returns {Map} 模块列表
         */
        list() {
            return this.modules;
        }

        /**
         * 移除模块
         * @param {string} name - 模块名称
         */
        remove(name) {
            if (this.modules.delete(name)) {
                console.info(`模块 ${name} 已移除`);
            }
        }

        /**
         * 触发钩子
         * @param {string} hookName - 钩子名称
         * @param {*} data - 传递给钩子的数据
         */
        triggerHook(hookName, data) {
            if (this.hooks.has(hookName)) {
                this.hooks.get(hookName).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`执行钩子 ${hookName} 时出错: ${error.message}`);
                    }
                });
            }
        }

        /**
         * 添加钩子
         * @param {string} name - 钩子名称
         * @param {Function} callback - 回调函数
         */
        addHook(name, callback) {
            if (!this.hooks.has(name)) {
                this.hooks.set(name, new Set());
            }
            this.hooks.get(name).add(callback);
        }

        /**
         * 移除钩子
         * @param {string} name - 钩子名称
         * @param {Function} callback - 回调函数
         */
        removeHook(name, callback) {
            if (this.hooks.has(name)) {
                this.hooks.get(name).delete(callback);
            }
        }
    }

    /**
     * 脚本加载器类
     */
    class ScriptLoader {
        constructor() {
            this.moduleManager = new ModuleManager();
        }

        /**
         * 从GitHub加载脚本
         * @param {string} url - 脚本URL
         * @returns {Promise<string>} 脚本内容
         */
        async loadScript(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: (response) => {
                        if (response.status === 200) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error(`加载失败: ${response.status}`));
                        }
                    },
                    onerror: (error) => {
                        reject(new Error(`请求错误: ${error}`));
                    }
                });
            });
        }

        /**
         * 解析脚本头部信息
         * @param {string} content - 脚本内容
         * @returns {object} 脚本信息
         */
        parseScriptHeader(content) {
            const headerRegex = /\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/;
            const match = content.match(headerRegex);
            if (!match) return null;

            const info = {};
            const lines = match[1].split('\n');
            lines.forEach(line => {
                const matches = line.match(/\/\/ @(\w+)\s+(.+)/);
                if (matches) {
                    const [, key, value] = matches;
                    if (key in info) {
                        if (Array.isArray(info[key])) {
                            info[key].push(value);
                        } else {
                            info[key] = [info[key], value];
                        }
                    } else {
                        info[key] = value;
                    }
                }
            });
            return info;
        }
    }

    /**
     * 框架主类
     */
    class Framework {
        constructor() {
            this.scriptLoader = new ScriptLoader();
            this.moduleManager = this.scriptLoader.moduleManager;
            this.version = GM_info.script.version;
        }

        /**
         * 初始化框架
         */
        async init() {
            try {
                console.info(`TK框架 v${this.version} 初始化中...`);
                
                // 注册内置模块
                if (typeof logger !== 'undefined') {
                    this.moduleManager.register('logger', logger);
                }
                
                // 初始化所有已注册模块
                this.moduleManager.initializeModules();
                
                // 触发初始化完成钩子
                this.moduleManager.triggerHook('init', {
                    version: this.version,
                    modules: this.moduleManager.list()
                });

                console.info('框架初始化完成！');
            } catch (error) {
                console.error(`框架初始化失败: ${error.message}`);
            }
        }
    }

    // 创建框架实例
    const framework = new Framework();
    
    // 确保在 DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => framework.init());
    } else {
        framework.init();
    }

    // 导出框架实例到全局作用域
    window.TK = framework;
})(); 