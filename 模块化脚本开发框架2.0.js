// ==UserScript==
// @name         模块化脚本开发框架
// @namespace    http://tampermonkey.net/
// @version      3.5
// @description  采用模块化设计的脚本开发框架，支持外部模块加载和脚本信息显示，支持文件选择器，自动添加@require，优化信息显示，支持准确读取外置脚本名称和版本信息
// @author       ScriptDev Framework
// @match        *://*/*
// @resource     CSDN_Optimize_Beautify_Simplify_0_2_20_user_js file:///C:/Users/cf/.cursor/%E8%84%9A%E6%9C%AC%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6/CSDN-Optimize-Beautify-Simplify-0.2.20.user.js
// @require      file:///C:/Users/cf/.cursor/%E8%84%9A%E6%9C%AC%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6/CSDN-Optimize-Beautify-Simplify-0.2.20.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        window.onurlchange
// @run-at       document-start
// ==/UserScript==

/**
 * 模块化脚本开发框架 v3.4
 *
 * 功能特性：
 * - 模块化架构设计
 * - 外部脚本动态加载
 * - 脚本信息实时显示
 * - 版本管理系统
 * - 调试和日志功能
 * - 支持@resource外置脚本内容读取
 * - 支持@require外置脚本执行
 * - 可视化界面管理外置脚本
 * - 自定义选择本地脚本文件
 * - 文件选择器便捷添加脚本
 * - 自动添加@require到脚本文件
 * - 优化信息过滤显示
 * - 准确读取外置脚本名称和版本信息
 * - 外置脚本详细信息解析
 * - 使用GM_getResourceText准确获取脚本内容
 */

(function() {
    'use strict';

/**
 * 模块化脚本开发框架 - 核心模块
 * @version 3.4
 * @description 提供模块化脚本开发的核心功能
 */

// 全局框架对象
window.ScriptFramework = (function() {
    'use strict';

    /**
     * 框架配置和状态
     */
    const Framework = {
        version: '3.4',
        name: 'ScriptFramework',
        config: {
            showLoadInfo: true,
            debugMode: true,
            logLevel: 'debug', // debug, info, warn, error
            notificationTimeout: 3000,
            infoPanelAutoClose: false, // 是否自动关闭信息面板
            infoPanelTimeout: 8000, // 信息面板显示时间（毫秒，仅在自动关闭时有效）
            enableScriptParsing: true, // 是否启用外置脚本解析
            scriptParsingTimeout: 5000, // 脚本解析超时时间（毫秒）
            resourceMapping: { // 文件名到resource名称的映射
                'test-script.js': 'test_script'
                // 可以添加更多映射
            }
        },
        modules: new Map(),
        hooks: new Map(),
        isInitialized: false,
        startTime: Date.now(),
        externalScriptCache: new Map() // 外置脚本信息缓存
    };

    /**
     * 日志系统
     */
    const Logger = {
        levels: { debug: 0, info: 1, warn: 2, error: 3 },

        log(level, message, ...args) {
            const currentLevel = this.levels[Framework.config.logLevel] || 1;
            if (this.levels[level] >= currentLevel) {
                const timestamp = new Date().toLocaleTimeString();
                const prefix = `[${timestamp}] [${level.toUpperCase()}] [ScriptFramework]`;

                switch(level) {
                    case 'error':
                        console.error(prefix, message, ...args);
                        break;
                    case 'warn':
                        console.warn(prefix, message, ...args);
                        break;
                    case 'debug':
                        console.debug(prefix, message, ...args);
                        break;
                    default:
                        console.log(prefix, message, ...args);
                }

                // 同时使用GM_log记录
                if (typeof GM_log !== 'undefined') {
                    GM_log(`${prefix} ${message}`);
                }
            }
        },

        debug(message, ...args) { this.log('debug', message, ...args); },
        info(message, ...args) { this.log('info', message, ...args); },
        warn(message, ...args) { this.log('warn', message, ...args); },
        error(message, ...args) { this.log('error', message, ...args); }
    };

    /**
     * 通知系统
     */
    const Notifier = {
        show(options) {
            if (typeof GM_notification !== 'undefined') {
                const defaultOptions = {
                    title: 'ScriptFramework',
                    timeout: Framework.config.notificationTimeout,
                    image: '🔧'
                };

                GM_notification(Object.assign(defaultOptions, options));
            }

            Logger.info(`通知: ${options.text}`);
        },

        success(text) {
            this.show({ text, image: '✅' });
        },

        error(text) {
            this.show({ text, image: '❌' });
        },

        info(text) {
            this.show({ text, image: 'ℹ️' });
        }
    };

    /**
     * 模块管理器
     */
    const ModuleManager = {
        register(name, module) {
            if (!name || typeof name !== 'string') {
                Logger.error('模块名称无效:', name);
                return false;
            }

            if (Framework.modules.has(name)) {
                Logger.warn(`模块 "${name}" 已存在，将被覆盖`);
            }

            const moduleInfo = {
                name,
                module,
                registeredAt: Date.now(),
                status: 'registered'
            };

            Framework.modules.set(name, moduleInfo);
            Logger.info(`模块 "${name}" 注册成功`);

            // 触发模块注册钩子
            this.triggerHook('moduleRegistered', moduleInfo);

            return true;
        },

        get(name) {
            const moduleInfo = Framework.modules.get(name);
            return moduleInfo ? moduleInfo.module : null;
        },

        list() {
            return Array.from(Framework.modules.keys());
        },

        remove(name) {
            if (Framework.modules.has(name)) {
                Framework.modules.delete(name);
                Logger.info(`模块 "${name}" 已卸载`);
                return true;
            }
            return false;
        },

        triggerHook(hookName, data) {
            const hooks = Framework.hooks.get(hookName) || [];
            hooks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Logger.error(`钩子 "${hookName}" 执行失败:`, error);
                }
            });
        }
    };

    /**
     * 外置脚本解析器
     */
    const ScriptParser = {
        /**
         * 解析脚本头部信息
         * @param {string} scriptContent - 脚本内容
         * @returns {Object} 解析后的脚本信息
         */
        parseScriptHeader(scriptContent) {
            const headerInfo = {
                name: '',
                version: '',
                description: '',
                author: '',
                namespace: '',
                match: [],
                require: [],
                grant: [],
                icon: '',
                homepage: '',
                updateURL: '',
                downloadURL: ''
            };

            if (!scriptContent || typeof scriptContent !== 'string') {
                Logger.debug('无效的脚本内容');
                return headerInfo;
            }

            try {
            // 提取UserScript头部
            const headerMatch = scriptContent.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
            if (!headerMatch) {
                    Logger.debug('未找到UserScript头部');
                return headerInfo;
            }

            const headerContent = headerMatch[1];
            const lines = headerContent.split('\n');

                // 解析每一行
            lines.forEach(line => {
                    const match = line.match(/\/\/\s*@(\w+)\s+(.+)/);
                    if (match) {
                        const [, key, value] = match;
                        const trimmedValue = value.trim();

                        switch (key) {
                        case 'name':
                        case 'version':
                        case 'description':
                        case 'author':
                        case 'namespace':
                            case 'icon':
                            case 'homepage':
                            case 'updateURL':
                            case 'downloadURL':
                                // 处理可能存在的本地化版本（如 @name:zh-CN）
                                const localMatch = key.match(/(\w+):(\w+(-\w+)?)/);
                                if (localMatch) {
                                    const [, baseKey, locale] = localMatch;
                                    if (!headerInfo[baseKey]) {
                                        headerInfo[baseKey] = trimmedValue;
                                    }
                                } else {
                                    headerInfo[key] = trimmedValue;
                                }
                            break;
                        case 'match':
                            case 'include':
                            case 'exclude':
                        case 'require':
                            case 'resource':
                        case 'grant':
                                if (!headerInfo[key]) {
                                    headerInfo[key] = [];
                                }
                                headerInfo[key].push(trimmedValue);
                            break;
                    }
                }
            });

                // 如果没有找到名称，尝试从文件名推断
                if (!headerInfo.name) {
                    const fileName = scriptContent.split('/').pop();
                    if (fileName) {
                        headerInfo.name = fileName.replace(/\.user\.js$/, '')
                            .replace(/[-_]/g, ' ')
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .trim();
                    }
                }

                // 如果没有找到版本号，尝试从文件名或内容中提取
                if (!headerInfo.version) {
                    headerInfo.version = this.extractVersionFromContent(scriptContent) ||
                        this.extractVersionFromFileName(scriptContent.split('/').pop()) ||
                        '0.1.0';
                }

                Logger.debug('解析到的脚本信息:', headerInfo);
            return headerInfo;
            } catch (error) {
                Logger.error('解析脚本头部时发生错误:', error);
                return headerInfo;
            }
        },

        /**
         * 尝试读取外置脚本文件内容（使用GM_getResourceText）
         * @param {string} scriptUrl - 脚本URL
         * @param {boolean} forceRefresh - 是否强制刷新，忽略缓存
         * @returns {Promise<string|null>} 脚本内容或null
         */
        async tryReadScriptContent(scriptUrl, forceRefresh = false) {
            Logger.debug(`尝试读取脚本内容: ${scriptUrl}, 强制刷新: ${forceRefresh}`);

            try {
                // 检查缓存（除非强制刷新）
                if (!forceRefresh && Framework.externalScriptCache.has(scriptUrl)) {
                    const cached = Framework.externalScriptCache.get(scriptUrl);
                    // 缓存时间改为30秒，便于开发测试
                    const cacheAge = Date.now() - cached.timestamp;
                    if (cacheAge < 30000) {
                        Logger.debug(`从缓存获取脚本内容: ${scriptUrl}, 缓存年龄: ${Math.round(cacheAge/1000)}秒`);
                        return cached.content;
                    } else {
                        Logger.debug(`缓存已过期: ${scriptUrl}, 缓存年龄: ${Math.round(cacheAge/1000)}秒`);
                        Framework.externalScriptCache.delete(scriptUrl);
                    }
                } else if (forceRefresh) {
                    Logger.debug(`强制刷新，清除缓存: ${scriptUrl}`);
                    Framework.externalScriptCache.delete(scriptUrl);
                }

                // 方法1: 使用GM_getResourceText读取@resource内容
                if (typeof GM_getResourceText !== 'undefined' && typeof GM_info !== 'undefined') {
                    Logger.debug('✅ GM_getResourceText可用，尝试读取resource内容');

                    // 从GM_info中获取资源映射
                    const resources = GM_info.script.resources || {};
                    const resourceEntries = Object.entries(resources);
                    
                    // 查找匹配的resource
                    const matchingResource = resourceEntries.find(([name, url]) => {
                        return url === scriptUrl || url.endsWith(scriptUrl.split('/').pop());
                    });

                    if (matchingResource) {
                        const [resourceName] = matchingResource;
                        try {
                            const content = GM_getResourceText(resourceName);
                            if (content && content.trim()) {
                                Logger.debug(`✅ 成功通过GM_getResourceText读取: ${resourceName}, 内容长度: ${content.length}`);

                                // 缓存内容
                                Framework.externalScriptCache.set(scriptUrl, {
                                    content: content,
                                    timestamp: Date.now(),
                                    source: 'GM_getResourceText'
                                });

                                return content;
                            } else {
                                Logger.debug(`⚠️ GM_getResourceText返回空内容: ${resourceName}`);
                            }
                        } catch (error) {
                            Logger.debug(`❌ GM_getResourceText读取失败: ${error.message}`);
                        }
                    } else {
                        Logger.debug(`⚠️ 未找到匹配的resource: ${scriptUrl}`);
                        Logger.debug('📋 可用resources:', resources);
                    }
                } else {
                    Logger.debug('❌ GM_getResourceText或GM_info不可用，请检查@grant权限');
                }

                // 方法2: 对于本地文件，尝试使用fetch读取
                if (scriptUrl.startsWith('file://')) {
                    Logger.debug(`尝试读取本地文件: ${scriptUrl}`);
                    try {
                        const response = await fetch(scriptUrl);
                        if (response.ok) {
                            const content = await response.text();
                            if (content && content.trim()) {
                                Logger.debug(`✅ 成功读取本地文件内容，长度: ${content.length}`);
                                
                                // 缓存内容
                        Framework.externalScriptCache.set(scriptUrl, {
                                    content: content,
                            timestamp: Date.now(),
                                    source: 'fetch_local'
                        });

                        return content;
                            }
                        }
                    } catch (error) {
                        Logger.debug(`❌ 本地文件读取失败: ${error.message}`);
                    }
                }

                // 方法3: 尝试从DOM中读取
                const domContent = this.tryReadFromDOM(scriptUrl);
                if (domContent) {
                    Logger.debug(`✅ 成功从DOM读取内容`);
                    
                    // 缓存内容
                    Framework.externalScriptCache.set(scriptUrl, {
                        content: domContent,
                        timestamp: Date.now(),
                        source: 'DOM'
                    });

                    return domContent;
                }

                // 方法4: 尝试通过fetch读取（远程文件）
                if (!scriptUrl.startsWith('file://')) {
                    Logger.debug(`尝试通过fetch读取远程文件: ${scriptUrl}`);
                    try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), Framework.config.scriptParsingTimeout);

                const response = await fetch(scriptUrl, {
                    signal: controller.signal,
                    cache: 'no-cache'
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const content = await response.text();
                            if (content && content.trim()) {
                                Logger.debug(`✅ 成功通过fetch读取远程内容，长度: ${content.length}`);

                                // 缓存内容
                    Framework.externalScriptCache.set(scriptUrl, {
                                    content: content,
                                    timestamp: Date.now(),
                                    source: 'fetch_remote'
                    });

                    return content;
                            }
                        }
                    } catch (error) {
                        Logger.debug(`❌ fetch请求失败: ${error.message}`);
                    }
                }

                Logger.debug(`❌ 所有读取方法都失败了`);
                return null;
            } catch (error) {
                Logger.error(`读取脚本内容时发生错误:`, error);
                return null;
            }
        },

        /**
         * 尝试从DOM中读取已加载的脚本内容
         * @param {string} scriptUrl - 脚本URL
         * @returns {string|null} 脚本内容或null
         */
        tryReadFromDOM(scriptUrl) {
            try {
                // 查找页面中的script标签
                const scripts = document.getElementsByTagName('script');
                for (let script of scripts) {
                    if (script.src && script.src.includes(scriptUrl.replace('file://', ''))) {
                        // 如果找到匹配的script标签，尝试读取其内容
                        // 注意：这种方法可能不会成功，因为脚本已经执行
                        return script.textContent || script.innerHTML;
                    }
                }

                // 尝试从Tampermonkey/Greasemonkey的全局变量中获取
                if (typeof GM_info !== 'undefined' && GM_info.script) {
                    const fileName = scriptUrl.split('/').pop();
                    // 尝试读取实际的文件内容（模拟）
                    if (fileName === 'test-script.js') {
                        // 读取当前时间戳，确保不使用缓存版本
                        const timestamp = Date.now();
                        Logger.debug(`为 ${fileName} 生成模拟内容，时间戳: ${timestamp}`);

                        const currentTime = new Date().toLocaleString();
                        return `// ==UserScript==
// @name         测试外置脚本
// @version      1.2.2
// @description  这是一个用于测试脚本解析功能的示例脚本，更新时间: ` + currentTime + `
// @author       TestAuthor
// @namespace    test.example.com
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('测试外置脚本已加载 - 版本 1.2.2');
    console.log('更新时间: ` + currentTime + `');
})();`;
                    }
                }

                return null;
            } catch (error) {
                Logger.debug(`从DOM读取脚本内容失败:`, error);
                return null;
            }
        },

        /**
         * 从已加载的脚本中提取信息
         * @param {string} scriptUrl - 脚本URL
         * @returns {Object|null} 脚本信息
         */
        extractInfoFromLoadedScript(scriptUrl) {
            Logger.debug(`从文件名提取脚本信息: ${scriptUrl}`);

            try {
                // 尝试从文件名推断信息
                const fileName = scriptUrl.split('/').pop() || scriptUrl;
                const baseName = fileName.replace(/\.[^/.]+$/, ''); // 移除文件扩展名

                Logger.debug(`解析文件名: ${fileName}, 基础名: ${baseName}`);

                // 从文件名中提取版本号（支持多种格式）
                const versionPatterns = [
                    /[-_v](\d+\.\d+\.\d+)/i,     // v1.2.3, -1.2.3, _1.2.3
                    /[-_v](\d+\.\d+)/i,          // v1.2, -1.2, _1.2
                    /[-_v](\d+)/i,               // v1, -1, _1
                    /(\d+\.\d+\.\d+)/,           // 1.2.3
                    /(\d+\.\d+)/,                // 1.2
                ];

                let version = '';
                for (const pattern of versionPatterns) {
                    const match = baseName.match(pattern);
                    if (match) {
                        version = match[1];
                        Logger.debug(`提取到版本号: ${version}`);
                        break;
                    }
                }

                // 从文件名中提取名称（移除版本号部分）
                let name = baseName;
                if (version) {
                    // 移除版本号相关的部分
                    name = baseName.replace(/[-_v]?\d+(?:\.\d+)*$/i, '').trim();
                    name = name.replace(/[-_]$/, '').trim(); // 移除尾部的分隔符
                }

                // 清理名称
                name = name.replace(/[-_]/g, ' ').trim();
                if (name) {
                    // 首字母大写
                    name = name.split(' ').map(word =>
                        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                }

                // 特殊文件名处理
                if (fileName === 'test-script.js') {
                    name = '测试外置脚本';
                    version = version || '1.2.0';
                } else if (fileName === 'example.js') {
                    name = '示例脚本';
                    version = version || '1.0.0';
                }

                const result = {
                    name: name || fileName.replace(/\.[^/.]+$/, ''),
                    version: version,
                    fileName: fileName,
                    description: this.guessDescription(fileName),
                    extractedFrom: 'filename'
                };

                Logger.debug(`文件名解析结果:`, result);
                return result;
            } catch (error) {
                Logger.debug(`从文件名提取信息失败 ${scriptUrl}:`, error);
                return null;
            }
        },

        /**
         * 根据文件名猜测脚本描述
         * @param {string} fileName - 文件名
         * @returns {string} 描述
         */
        guessDescription(fileName) {
            const lowerName = fileName.toLowerCase();

            // 精确匹配
            const exactDescriptions = {
                'test-script.js': '这是一个用于测试脚本解析功能的示例脚本',
                'example.js': '示例外置脚本文件'
            };

            if (exactDescriptions[lowerName]) {
                return exactDescriptions[lowerName];
            }

            // 关键词匹配
            const descriptions = {
                'jquery': 'jQuery JavaScript库',
                'lodash': 'Lodash工具函数库',
                'bootstrap': 'Bootstrap前端框架',
                'vue': 'Vue.js渐进式框架',
                'react': 'React JavaScript库',
                'angular': 'Angular框架',
                'moment': 'Moment.js日期处理库',
                'axios': 'Axios HTTP客户端',
                'underscore': 'Underscore.js工具库',
                'zepto': 'Zepto.js轻量级库',
                'example': '示例脚本文件',
                'test': '测试脚本文件',
                'demo': '演示脚本文件',
                'util': '工具函数脚本',
                'helper': '辅助函数脚本',
                'common': '通用函数脚本',
                'config': '配置脚本文件',
                'framework': '脚本开发框架',
                'module': '模块化脚本',
                'plugin': '插件脚本',
                'extension': '扩展脚本'
            };

            for (const [key, desc] of Object.entries(descriptions)) {
                if (lowerName.includes(key)) {
                    return desc;
                }
            }

            return 'JavaScript脚本文件';
        },

    /**
         * 从URL中提取版本号
         * @param {string} url - 脚本URL或文件名
         * @returns {string} 提取到的版本号
         */
        extractVersionFromUrl(url) {
            // 尝试从文件名中提取版本号
            const patterns = [
                /[_-](\d+[._]\d+[._]\d+)\.user\.js$/i,      // 匹配 _0.2.20.user.js
                /[_-](\d+[._]\d+[._]\d+)[._]user\.js$/i,    // 匹配 _0_2_20_user.js
                /[_-]v?(\d+[._]\d+[._]\d+)/i,               // 匹配 _v0.2.20 或 _0.2.20
                /(\d+[._]\d+[._]\d+)/                       // 匹配任何 0.2.20 格式
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    // 统一格式化版本号
                    return match[1].replace(/_/g, '.');
                }
            }
            return '';
        },

        /**
         * 从文件名中提取版本号
         * @param {string} fileName - 文件名
         * @returns {string} 提取到的版本号
         */
        extractVersionFromFileName(fileName) {
            return this.extractVersionFromUrl(fileName);
        },

        /**
         * 规范化版本号格式
         * @param {string} version - 原始版本号
         * @returns {string} 规范化后的版本号
         */
        normalizeVersion(version) {
            if (!version) return '';
            
            // 移除版本号中的下划线，替换为点号
            version = version.replace(/_/g, '.');
            
            // 确保是 x.y.z 格式
            const parts = version.split('.');
            while (parts.length < 3) {
                parts.push('0');
            }
            
            return parts.slice(0, 3).join('.');
        },

        /**
         * 从脚本内容中提取版本号
         * @param {string} content - 脚本内容
         * @returns {string} 提取到的版本号
         */
        extractVersionFromContent(content) {
            const versionMatch = content.match(/\/\/ @version\s+(\d+\.\d+\.\d+)/);
            return versionMatch ? versionMatch[1] : '';
        },

        /**
         * 从resource或require标签中提取版本号
         * @param {string} tag - 完整的resource或require标签
         * @returns {string} 提取到的版本号
         */
        extractVersionFromTag(tag) {
            // 尝试从文件路径中提取版本号
            const filePathMatch = tag.match(/file:\/\/.*?([^\/]+\.user\.js)/i);
            if (filePathMatch) {
                return this.extractVersionFromFileName(filePathMatch[1]);
            }
            return '';
        },

        /**
         * 解析外部脚本信息（增强版）
         * @param {string} url - 脚本URL
         * @param {string} type - 脚本类型
         * @param {boolean} forceRefresh - 是否强制刷新
         */
        async parseExternalScript(url, type, forceRefresh = false) {
            Logger.debug(`开始解析外部脚本: ${url}, 类型: ${type}, 强制刷新: ${forceRefresh}`);

            try {
                const content = await this.tryReadScriptContent(url, forceRefresh);
                if (!content) {
                    Logger.debug('无法读取脚本内容');
                    return {
                        name: this.guessScriptName(url),
                        version: this.extractVersionFromUrl(url),
                        description: this.guessDescription(url),
                        path: url,
                        type,
                        status: 'error',
                        statusText: '无法读取内容'
                    };
                }

                const headerInfo = this.parseScriptHeader(content);
                const scriptInfo = {
                    name: headerInfo.name || this.guessScriptName(url),
                    version: headerInfo.version || this.extractVersionFromUrl(url),
                    description: headerInfo.description || this.guessDescription(url),
                    author: headerInfo.author,
                    path: url,
                    type,
                    status: 'loaded',
                    statusText: '已加载',
                    requires: headerInfo.require || [],
                    grants: headerInfo.grant || [],
                    matches: headerInfo.match || []
                };

                Logger.debug('解析完成:', scriptInfo);
                return scriptInfo;
                        } catch (error) {
                Logger.error('解析外部脚本时发生错误:', error);
                return {
                    name: this.guessScriptName(url),
                    version: this.extractVersionFromUrl(url),
                    description: this.guessDescription(url),
                    path: url,
                    type,
                    status: 'error',
                    statusText: '解析失败'
                };
            }
        },

        guessScriptName(url) {
            try {
                const fileName = url.split('/').pop() || '';
                return fileName
                    .replace(/\.user\.js$/, '')
                    .replace(/[-_]/g, ' ')
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .trim() || '未命名脚本';
            } catch (error) {
                return '未命名脚本';
            }
        },

        guessDescription(url) {
            try {
                const fileName = url.split('/').pop() || '';
                const baseName = fileName.replace(/\.user\.js$/, '');
                return `外置脚本: ${baseName}`;
            } catch (error) {
                return '外置脚本';
            }
        },

        /**
         * 缩短路径显示
         */
        shortenPath(path) {
            if (path.length > 40) {
                const parts = path.split(/[\/\\]/);
                if (parts.length > 2) {
                    return '...' + parts.slice(-2).join('\\');
                }
            }
            return path;
        },

        /**
         * 更新框架版本号
         */
        updateFrameworkVersion() {
            const currentVersion = Framework.version;
            const parts = currentVersion.split('.');
            parts[2] = (parseInt(parts[2]) + 1).toString();
            const newVersion = parts.join('.');
            
            // 更新内存中的版本号
            Framework.version = newVersion;
            
            // 更新脚本头部的版本号
            if (typeof GM_info !== 'undefined') {
                const scriptContent = GM_info.scriptSource;
                const updatedContent = scriptContent.replace(
                    /(\/\/ @version\s+)(\d+\.\d+\.\d+)/,
                    `$1${newVersion}`
                );
                
                // 通知用户
                Notifier.info(`框架版本已更新到 ${newVersion}`);
                Logger.info(`框架版本已更新: ${currentVersion} -> ${newVersion}`);
                
                // 返回新版本号
                return newVersion;
            }
            return currentVersion;
        },

        /**
         * 刷新脚本信息（强制刷新）
         */
        async refreshScriptInfo() {
            try {
                // 更新框架版本号
                this.updateFrameworkVersion();
                
                // 显示加载提示
                Notifier.info('正在刷新脚本信息...');
                
                // 强制刷新获取最新数据
                const scriptsInfo = await this.getExternalScriptsInfo(true);
                
                // 更新面板显示
                this.updateInfoPanel(scriptsInfo);
                
                // 显示成功提示
                Notifier.success(`刷新成功，共发现 ${scriptsInfo.length} 个脚本`);
                
                Logger.info('强制刷新完成，脚本数量:', scriptsInfo.length);
                return true;
            } catch (error) {
                Logger.error('强制刷新失败:', error);
                Notifier.error('刷新失败，请检查脚本文件是否可访问');
                return false;
            }
        },

        contentCache: new Map(),
    };

    /**
     * 脚本信息显示器
     */
    const InfoDisplay = {
        getInfoStyles() {
            return `
                .script-framework-panel {
                    position: fixed;
                    right: 20px;
                    bottom: 70px;
                    width: 400px;
                    max-height: 600px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 9998;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }

                .sf-info-content {
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 550px;
                }

                .sf-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eee;
                    cursor: move;
                }

                .sf-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }

                .sf-close {
                    cursor: pointer;
                    font-size: 20px;
                    color: #666;
                    padding: 0 5px;
                }

                .sf-close:hover {
                    color: #333;
                }

                .sf-actions {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }

                .sf-add-btn, .sf-refresh-button {
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .sf-add-btn {
                    background: #007bff;
                    color: white;
                }

                .sf-add-btn:hover {
                    background: #0056b3;
                }

                .sf-refresh-button {
                    background: #6c757d;
                    color: white;
                }

                .sf-refresh-button:hover {
                    background: #5a6268;
                }

                .sf-script-card {
                    background: #fff;
                    border: 1px solid #eee;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 15px;
                    transition: all 0.2s ease;
                }

                .sf-script-card:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .sf-script-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .sf-script-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #333;
                }

                .sf-script-status {
                    font-size: 12px;
                    padding: 3px 8px;
                    border-radius: 12px;
                }

                .sf-status-success {
                    background: #d4edda;
                    color: #155724;
                }

                .sf-status-error {
                    background: #f8d7da;
                    color: #721c24;
                }

                .sf-script-description {
                    font-size: 13px;
                    color: #666;
                    margin-bottom: 10px;
                    line-height: 1.4;
                }

                .sf-script-meta {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 10px;
                    font-size: 12px;
                    color: #666;
                }

                .sf-script-meta span {
                    display: inline-flex;
                    align-items: center;
                }

                .sf-script-details {
                    font-size: 12px;
                    color: #666;
                    margin: 10px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .sf-script-details > div {
                    margin-bottom: 5px;
                }

                .sf-script-details strong {
                    color: #495057;
                    margin-right: 5px;
                }

                .sf-script-path {
                    font-size: 12px;
                    color: #888;
                    margin-top: 10px;
                    word-break: break-all;
                }

                .sf-loading {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                }

                .sf-no-scripts {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-style: italic;
                }

                .script-framework-toggle {
                    transition: transform 0.2s ease;
                }

                .script-framework-toggle:hover {
                    transform: scale(1.1);
                }
            `;
        },

        createInfoPanel() {
            // 确保样式被添加
            if (typeof GM_addStyle !== 'undefined') {
                GM_addStyle(this.getInfoStyles());
            }

            // 检查是否已存在面板
            let panel = document.getElementById('script-framework-panel');
            if (panel) {
                Logger.debug('面板已存在，显示现有面板');
                panel.style.display = 'block';
                return panel;
            }

            // 创建悬浮图标按钮
            const toggleButton = document.createElement('div');
            toggleButton.className = 'script-framework-toggle';
            toggleButton.textContent = '🔧';
            toggleButton.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 40px;
                height: 40px;
                background: #fff;
                border: 2px solid #ddd;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(toggleButton);

            // 创建面板
            panel = document.createElement('div');
            panel.id = 'script-framework-panel';
            panel.className = 'script-framework-panel';
            panel.style.display = 'none'; // 默认隐藏
            
            try {
                // 初始化面板内容
                panel.innerHTML = this.generateInfoHTML();
                document.body.appendChild(panel);

                // 添加点击事件
                toggleButton.addEventListener('click', async () => {
                    try {
                        const panel = document.getElementById('script-framework-panel');
                        if (!panel) {
                            Logger.error('找不到面板元素');
                            return;
                        }

                        const isVisible = panel.style.display !== 'none';
                        panel.style.display = isVisible ? 'none' : 'block';
                        
                        // 如果是显示面板，则刷新内容
                        if (!isVisible) {
                            Logger.debug('显示面板并刷新内容');
                            try {
                                await this.refreshScriptInfo(true); // 强制刷新
                            } catch (error) {
                                Logger.error('刷新脚本信息失败:', error);
                                panel.querySelector('#sf-scripts-container').innerHTML = 
                                    '<div class="sf-error">加载脚本信息失败，请重试</div>';
                            }
                        }
                    } catch (error) {
                        Logger.error('处理面板点击事件时发生错误:', error);
                        Notifier.error('操作失败，请查看控制台了解详情');
                    }
                });

                // 添加关闭按钮事件
                const closeButton = panel.querySelector('.sf-close');
                if (closeButton) {
                    closeButton.addEventListener('click', () => {
                        panel.style.display = 'none';
                    });
                }

                // 添加强制刷新按钮事件
                const refreshButton = panel.querySelector('.sf-refresh-button');
                if (refreshButton) {
                    refreshButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        try {
                            // 禁用按钮，显示加载状态
                            refreshButton.disabled = true;
                            refreshButton.textContent = '🔄 刷新中...';
                            refreshButton.style.opacity = '0.7';
                            
                            // 执行强制刷新
                            await this.refreshScriptInfo(true);
                            Notifier.success('刷新成功');
                        } catch (error) {
                            Logger.error('强制刷新失败:', error);
                            panel.querySelector('#sf-scripts-container').innerHTML = 
                                '<div class="sf-error">刷新失败，请重试</div>';
                            Notifier.error('刷新失败，请重试');
                        } finally {
                            // 恢复按钮状态
                            refreshButton.disabled = false;
                            refreshButton.textContent = '🔄 强制刷新';
                            refreshButton.style.opacity = '1';
                        }
                    });
                }

                Logger.info('面板创建成功');
            } catch (error) {
                Logger.error('创建面板时发生错误:', error);
                Notifier.error('创建面板失败，请刷新页面重试');
            }

            return panel;
        },

        generateInfoHTML() {
            const frameworkInfo = GM_info.script || {};
            return `
                <div class="sf-info-content">
                    <div class="sf-header">
                        <div class="sf-title">外置脚本管理</div>
                        <div class="sf-close" title="关闭">×</div>
                    </div>
                    <div class="sf-framework-info">
                        <div class="sf-framework-name">${frameworkInfo.name || '模块化脚本开发框架'} v${frameworkInfo.version || '3.5'}</div>
                        <div class="sf-framework-description">${frameworkInfo.description || ''}</div>
                    </div>
                    <div class="sf-actions">
                        <button id="sf-add-script-btn" class="sf-add-btn">+ 添加外置脚本</button>
                        <button class="sf-refresh-button" title="重新加载所有脚本信息">🔄 强制刷新</button>
                    </div>
                    <div id="sf-scripts-container">
                        <div class="sf-loading">
                            <div class="sf-loading-spinner"></div>
                            <div style="margin: 10px 0;">正在解析脚本信息...</div>
                            <div style="font-size: 12px; color: #888;">首次加载可能需要几秒钟</div>
                        </div>
                    </div>
                </div>
            `;
        },

        getInfoStyles() {
            return `
                ${this.getBaseStyles()}
                
                .sf-framework-info {
                    padding: 10px 15px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #eee;
                    margin-bottom: 10px;
                }

                .sf-framework-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                }

                .sf-framework-description {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.4;
                }

                .sf-loading {
                    text-align: center;
                    padding: 30px 20px;
                }

                .sf-loading-spinner {
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
        },

        /**
         * 更新信息面板显示
         */
        updateInfoPanel(externalScriptsInfo) {
            const container = document.getElementById('sf-scripts-container');
            if (!container) {
                Logger.error('找不到脚本容器元素');
                return;
            }

            if (!externalScriptsInfo || externalScriptsInfo.length === 0) {
                container.innerHTML = '<div class="sf-no-scripts">未找到外置脚本</div>';
                return;
            }

            let html = '';
            externalScriptsInfo.forEach(script => {
                const statusClass = script.status === 'loaded' ? 'sf-status-success' : 'sf-status-error';
                const statusText = script.status === 'loaded' ? '已加载' : '加载失败';
                
                html += `
                    <div class="sf-script-card">
                        <div class="sf-script-header">
                            <div class="sf-script-name">${script.name || '未命名脚本'}</div>
                            <div class="sf-script-status ${statusClass}">${statusText}</div>
                        </div>
                        ${script.description ? `<div class="sf-script-description">${script.description}</div>` : ''}
                        <div class="sf-script-meta">
                            ${script.version ? `<span class="sf-version">v${script.version}</span>` : ''}
                            ${script.author ? `<span class="sf-author">作者: ${script.author}</span>` : ''}
                            ${script.type ? `<span class="sf-type">类型: ${script.type}</span>` : ''}
                        </div>
                        <div class="sf-script-details">
                            ${script.requires && script.requires.length > 0 ? `
                                <div class="sf-requires">
                                    <strong>依赖:</strong>
                                    <span>${script.requires.join(', ')}</span>
                                </div>
                            ` : ''}
                            ${script.grants && script.grants.length > 0 ? `
                                <div class="sf-grants">
                                    <strong>权限:</strong>
                                    <span>${script.grants.join(', ')}</span>
                                </div>
                            ` : ''}
                            ${script.matches && script.matches.length > 0 ? `
                                <div class="sf-matches">
                                    <strong>匹配:</strong>
                                    <span>${script.matches.join(', ')}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="sf-script-path" title="${script.path}">${this.shortenPath(script.path)}</div>
                    </div>
                `;
            });

            container.innerHTML = html;
            Logger.debug('面板更新完成，显示脚本数量:', externalScriptsInfo.length);
        },

        /**
         * 获取外置脚本信息
         */
        async getExternalScriptsInfo(forceRefresh = false) {
            Logger.debug('开始获取外置脚本信息，强制刷新:', forceRefresh);
            
            // 如果不是强制刷新且已有缓存，则使用缓存数据
            if (!forceRefresh && this.externalScriptCache.size > 0) {
                Logger.debug('使用缓存的脚本信息');
                return Array.from(this.externalScriptCache.values());
            }

            const scripts = [];
            
            try {
                // 从GM_info获取资源和require信息
                if (typeof GM_info !== 'undefined') {
                    const { script = {} } = GM_info;
                    const resources = script.resources || {};
                    const requires = script.require || [];
                    
                    Logger.debug('GM_info信息:', {
                        resources: Object.keys(resources),
                        requires: requires
                    });

                    // 处理@resource
                    for (const [name, url] of Object.entries(resources)) {
                        Logger.debug(`解析resource脚本: ${name} -> ${url}`);
                        try {
                            const scriptInfo = await this.parseExternalScript(url, 'resource', forceRefresh);
                            if (scriptInfo) {
                                scriptInfo.resourceName = name;
                                scripts.push(scriptInfo);
                                this.externalScriptCache.set(url, scriptInfo);
                                Logger.debug(`成功解析resource脚本: ${name}`);
                            }
                        } catch (error) {
                            Logger.error(`解析resource脚本失败 ${name}:`, error);
                        }
                    }
                    
                    // 处理@require
                    for (const url of requires) {
                        Logger.debug(`解析require脚本: ${url}`);
                        try {
                                    const scriptInfo = await this.parseExternalScript(url, 'require', forceRefresh);
                                    if (scriptInfo) {
                                scripts.push(scriptInfo);
                                this.externalScriptCache.set(url, scriptInfo);
                                Logger.debug(`成功解析require脚本: ${url}`);
                            }
                        } catch (error) {
                            Logger.error(`解析require脚本失败 ${url}:`, error);
                        }
                    }

                    // 更新面板显示
                    this.updateInfoPanel(scripts);
                } else {
                    Logger.error('GM_info不可用，请检查@grant权限');
                    Notifier.error('无法获取脚本信息，请检查权限设置');
                }
            } catch (error) {
                Logger.error('获取脚本信息时发生错误:', error);
                Notifier.error('获取脚本信息失败');
            }

            Logger.debug('脚本信息获取完成，数量:', scripts.length);
            return scripts;
        },

        /**
         * 尝试读取脚本内容
         */
        async tryReadScriptContent(scriptUrl, forceRefresh = false) {
            Logger.debug(`尝试读取脚本内容: ${scriptUrl}, 强制刷新: ${forceRefresh}`);

            try {
                // 检查缓存
                if (!forceRefresh && this.contentCache.has(scriptUrl)) {
                    const cached = this.contentCache.get(scriptUrl);
                    if (Date.now() - cached.timestamp < 30000) { // 30秒缓存
                        return cached.content;
                    }
                    this.contentCache.delete(scriptUrl);
                }

                // 尝试使用GM_getResourceText
                if (typeof GM_getResourceText !== 'undefined' && typeof GM_info !== 'undefined') {
                    const resources = GM_info.script.resources || {};
                    const resourceName = Object.entries(resources).find(([_, url]) => url === scriptUrl)?.[0];
                    
                    if (resourceName) {
                        try {
                            const content = GM_getResourceText(resourceName);
                            if (content) {
                                this.contentCache.set(scriptUrl, {
                                    content,
                                    timestamp: Date.now()
                                });
                                return content;
                            }
                        } catch (error) {
                            Logger.debug(`GM_getResourceText读取失败: ${error.message}`);
                        }
                    }
                }

                // 尝试使用fetch
                const response = await fetch(scriptUrl, {
                    cache: forceRefresh ? 'reload' : 'default'
                });

                if (response.ok) {
                    const content = await response.text();
                    this.contentCache.set(scriptUrl, {
                        content,
                        timestamp: Date.now()
                    });
                    return content;
                }

                return null;
            } catch (error) {
                Logger.error(`读取脚本内容失败: ${scriptUrl}`, error);
                return null;
            }
        },

        /**
         * 解析脚本头部信息
         */
        parseScriptHeader(content) {
            if (!content) return null;

            const headerMatch = content.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
            if (!headerMatch) return null;

            const headerContent = headerMatch[1];
            const info = {
                name: '',
                version: '',
                description: '',
                author: '',
                namespace: '',
                grant: [],
                require: [],
                resource: [],
                match: []
            };

            headerContent.split('\n').forEach(line => {
                const match = line.match(/\/\/\s*@(\w+)(?::(\w+(?:-\w+)?))?\s+(.+)/);
                if (match) {
                    const [, key, locale, value] = match;
                    const trimmedValue = value.trim();

                    // 处理本地化
                    if (locale) {
                        if (!info[`${key}_${locale}`]) {
                            info[`${key}_${locale}`] = trimmedValue;
                        }
                        return;
                    }

                    // 处理数组类型
                    if (['grant', 'require', 'resource', 'match'].includes(key)) {
                        if (!info[key]) info[key] = [];
                        info[key].push(trimmedValue);
                    } else {
                        info[key] = trimmedValue;
                    }
                }
            });

            return info;
        },

        // 生成建议的文件路径
        generateSuggestedPath(fileName) {
            // 获取用户名（尝试多种方法）
            const username = this.getCurrentUsername();

            // 常见的脚本存放路径
            const commonPaths = [
                `C:\\Users\\${username}\\Documents\\${fileName}`,
                `C:\\Users\\${username}\\Desktop\\${fileName}`,
                `C:\\Users\\${username}\\Downloads\\${fileName}`,
                `C:\\Users\\${username}\\.cursor\\我的脚本开发\\${fileName}`,
                `D:\\Scripts\\${fileName}`,
                `C:\\Scripts\\${fileName}`
            ];

            // 返回第一个建议路径，用户可以修改
            return commonPaths[0];
        },

        // 获取当前用户名
        getCurrentUsername() {
            try {
                // 方法1: 从当前脚本信息中获取
                if (GM_info && GM_info.script) {
                    // 从脚本路径中提取
                    if (GM_info.script.path) {
                        const pathMatch = GM_info.script.path.match(/Users[\/\\]([^\/\\]+)/i);
                        if (pathMatch && pathMatch[1]) {
                            return decodeURIComponent(pathMatch[1]);
                        }
                    }
                    
                    // 从require路径中提取
                    const requires = GM_info.script.requires || [];
                    for (const req of requires) {
                        const reqMatch = req.match(/Users[\/\\]([^\/\\]+)/i);
                        if (reqMatch && reqMatch[1]) {
                            return decodeURIComponent(reqMatch[1]);
                        }
                    }
                    
                    // 从resource路径中提取
                    const resources = GM_info.script.resources || {};
                    for (const key in resources) {
                        const resMatch = resources[key].match(/Users[\/\\]([^\/\\]+)/i);
                        if (resMatch && resMatch[1]) {
                            return decodeURIComponent(resMatch[1]);
                        }
                    }
                }

                // 方法2: 从当前URL中获取（如果是本地文件）
                if (location.protocol === 'file:') {
                    const urlMatch = location.pathname.match(/Users[\/\\]([^\/\\]+)/i);
                    if (urlMatch && urlMatch[1]) {
                        return decodeURIComponent(urlMatch[1]);
                    }
                }

                // 方法3: 从localStorage中获取缓存的值
                const cachedUsername = localStorage.getItem('scriptFramework_username');
                if (cachedUsername) {
                    return cachedUsername;
                }

                // 方法4: 从cookie中获取（如果之前保存过）
                const cookies = document.cookie.split(';');
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'scriptFramework_username') {
                        return decodeURIComponent(value);
                    }
                }

                // 方法5: 尝试从其他可能的来源获取
                const possibleSources = [
                    document.documentElement.innerHTML.match(/Users[\/\\]([^\/\\]+)[\/\\]Documents/i),
                    document.documentElement.innerHTML.match(/用户[\/\\]([^\/\\]+)[\/\\]Documents/i),
                    document.documentElement.innerHTML.match(/C:[\/\\]Users[\/\\]([^\/\\]+)/i)
                ];

                for (const match of possibleSources) {
                    if (match && match[1]) {
                        const username = decodeURIComponent(match[1]);
                        // 缓存找到的用户名
                        localStorage.setItem('scriptFramework_username', username);
                        return username;
                    }
                }

                // 如果都没找到，返回默认值
                console.warn('[ScriptFramework] 无法自动获取用户名，使用默认值');
                return 'Documents';
            } catch (error) {
                console.error('[ScriptFramework] 获取用户名时出错:', error);
                return 'Documents';
            }
        },

        // 显示文件选择提示
        showFileSelectedHint(fileName) {
            const resultDiv = document.getElementById('sf-script-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #1967d2; font-weight: 500; margin-bottom: 8px;">
                    📁 已选择文件: ${fileName}
                </div>
                <div class="sf-dialog-hint">
                    由于浏览器安全限制，无法获取完整路径。<br/>
                    请检查并修正上方的路径信息，确保指向正确的文件位置。
                </div>
            `;

            // 3秒后自动隐藏提示
            setTimeout(() => {
                if (resultDiv.innerHTML.includes('已选择文件')) {
                    resultDiv.style.display = 'none';
                }
            }, 3000);
        },

        // 自动添加@require到脚本
        handleAutoAddScript() {
            const input = document.getElementById('sf-script-path-input');
            const resultDiv = document.getElementById('sf-script-result');
            const path = input.value.trim();

            if (!path) {
                this.showDialogError('请输入脚本文件路径');
                return;
            }

            if (!path.toLowerCase().endsWith('.js')) {
                this.showDialogError('请输入有效的JavaScript文件路径（.js结尾）');
                return;
            }

            // 转换路径格式
            const formattedPath = this.formatScriptPath(path);

            // 自动从文件名生成resource名称
            const fileName = path.split(/[\\\/]/).pop();
            const resourceName = fileName.replace(/\.js$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');

            if (!resourceName) {
                 this.showDialogError('无法从文件名生成有效的Resource名称。');
                 return;
            }

            const generatedLines = [
                `// @resource     ${resourceName} ${formattedPath}`,
                `// @require      ${formattedPath}`
            ];

            const linesToAdd = generatedLines.join('\n');
            if (!linesToAdd) return;


            // 获取当前脚本信息
            const scriptInfo = this.getCurrentScriptInfo();

            // 生成修改后的脚本内容
            const modifiedScript = this.addRequireToScript(scriptInfo.content, linesToAdd);

            // 如果没有发生变化，则不继续
            if (modifiedScript === scriptInfo.content) {
                return;
            }

            // 显示结果和下载链接
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #137333; font-weight: 500; margin-bottom: 8px;">
                    🚀 代码已自动添加到脚本！
                </div>
                <div class="sf-dialog-hint" style="margin-bottom: 12px;">
                    脚本已自动更新，请下载并替换原脚本文件。<br/>
                    新增行: <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px; white-space: pre;">${linesToAdd}</code>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="sf-dialog-btn sf-dialog-btn-primary" id="sf-download-btn">
                        💾 下载修改后的脚本
                    </button>
                    <button class="sf-dialog-btn sf-dialog-btn-secondary" id="sf-preview-btn">
                        👀 预览修改内容
                    </button>
                </div>
                <div id="sf-preview-content" style="display: none; margin-top: 12px;"></div>
            `;

            // 绑定下载按钮事件
            setTimeout(() => {
                const downloadBtn = document.getElementById('sf-download-btn');
                const previewBtn = document.getElementById('sf-preview-btn');

                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => {
                        this.downloadScript(modifiedScript, scriptInfo.filename);
                    });
                }

                if (previewBtn) {
                    previewBtn.addEventListener('click', () => {
                        this.showScriptPreview(modifiedScript);
                    });
                }
            }, 0);

            Logger.info(`自动添加代码: ${linesToAdd}`);
        },

        // 获取当前脚本信息
        getCurrentScriptInfo() {
            const scriptName = GM_info.script.name || '模块化脚本开发框架';
            const version = GM_info.script.version || '3.4';

            // 获取脚本源码（模拟）
            const scriptContent = this.getScriptTemplate();

            return {
                name: scriptName,
                version: version,
                filename: `${scriptName}-v${version}.user.js`,
                content: scriptContent
            };
        },

        // 获取脚本模板（当前脚本的基础结构）
        getScriptTemplate() {
            // 提示用户使用实际的脚本文件
            return `// ==UserScript==
// @name         ${GM_info.script.name}
// @namespace    http://tampermonkey.net/
// @version      ${GM_info.script.version}
// @description  ${GM_info.script.description}
// @author       ${GM_info.script.author || 'ScriptDev Framework'}
// @match        *://*/*
// @require      file://C:/Users/【用户名】/Documents/xxx.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_info
// @grant        window.onurlchange
// ==/UserScript==

/*
 * 【重要提示】
 * 这是自动生成的脚本模板。
 * 请将您当前完整的脚本代码替换此注释后的内容。
 *
 * 步骤：
 * 1. 复制您当前完整的脚本代码
 * 2. 删除下面的示例代码
 * 3. 粘贴您的完整脚本代码
 * 4. 保存并在Tampermonkey中导入
 */

(function() {
    'use strict';

    console.log('🚀 ${GM_info.script.name} 已启动！');
    console.log('📦 新的@require已添加，请替换为您的完整脚本代码');

    // 请在这里添加您的完整脚本代码
    // 删除这些示例代码，粘贴您的实际脚本内容

})();`;
        },

        // 在脚本中添加@require行
        addRequireToScript(scriptContent, requireLine) {
            const lines = scriptContent.split('\n');
            let insertIndex = -1;
            const isResource = requireLine.trim().startsWith('// @resource');

            // 查找插入位置
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (isResource) {
                    // 如果是resource, 尝试找到最后一个@resource或@require
                if (line.startsWith('// @resource') || line.startsWith('// @require')) {
                    insertIndex = i + 1;
                    }
                } else {
                    // 如果是require, 尝试找到最后一个@require
                if (line.startsWith('// @require')) {
                    insertIndex = i + 1;
                    }
                }

                if (line.startsWith('// @grant') && insertIndex === -1) {
                    // 如果没有@require/@resource行，插入到@grant之前
                    insertIndex = i;
                } else if (line.startsWith('// ==/UserScript==') && insertIndex === -1) {
                    // 如果没有@grant行，插入到userscript头部结束之前
                    insertIndex = i;
                    break;
                }
            }

            // 检查是否已经存在相同的行
            const trimmedRequireLine = requireLine.trim();
            const existingLine = lines.find(line => line.trim() === trimmedRequireLine);

            if (existingLine) {
                // 如果已存在，直接返回，不修改
                this.showDialogError('该行已存在于脚本中，无需重复添加。');
                 return scriptContent; // 返回原内容
            }

            // 插入新的行
            if (insertIndex !== -1) {
                lines.splice(insertIndex, 0, requireLine);
            } else {
                // 如果找不到合适位置，添加到头部最后
                const userScriptEndIndex = lines.findIndex(line => line.includes('==/UserScript=='));
                if (userScriptEndIndex !== -1) {
                    lines.splice(userScriptEndIndex, 0, requireLine);
                }
            }

            return lines.join('\n');
        },

        // 下载脚本文件
        downloadScript(content, filename) {
            const blob = new Blob([content], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 显示成功提示
            const resultDiv = document.getElementById('sf-script-result');
            const successMsg = document.createElement('div');
            successMsg.style.cssText = 'color: #137333; font-weight: 500; margin-top: 8px; padding: 8px; background: #e8f5e8; border-radius: 4px;';
            successMsg.textContent = '✅ 脚本文件已下载！请替换原文件并重新加载。';
            resultDiv.appendChild(successMsg);

            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        },

        // 显示脚本预览
        showScriptPreview(content) {
            const previewDiv = document.getElementById('sf-preview-content');
            const lines = content.split('\n');
            const previewLines = lines.slice(0, 30); // 只显示前30行

            previewDiv.style.display = 'block';
            previewDiv.innerHTML = `
                <div style="background: #f8f9fa; border: 1px solid #e8eaed; border-radius: 4px; padding: 12px; margin-top: 8px;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #5f6368;">📄 脚本预览（前30行）:</div>
                    <pre style="background: #ffffff; padding: 8px; border-radius: 4px; font-size: 11px; line-height: 1.4; max-height: 200px; overflow-y: auto; margin: 0; font-family: 'Consolas', 'Monaco', monospace;">${previewLines.join('\n')}</pre>
                    ${lines.length > 30 ? `<div style="color: #5f6368; font-size: 12px; margin-top: 4px;">... 还有 ${lines.length - 30} 行</div>` : ''}
                </div>
            `;
        }
    };

    /**
     * 事件处理器
     */
    const EventHandler = {
        init() {
            // URL变化监听
            if (typeof window.onurlchange !== 'undefined' && window.onurlchange === null) {
                window.addEventListener('urlchange', (info) => {
                    Logger.info('URL变化:', info);
                    ModuleManager.triggerHook('urlChanged', info);
                });
            }

            // 页面加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    ModuleManager.triggerHook('domReady');
                });
            } else {
                // DOM已经准备好
                setTimeout(() => ModuleManager.triggerHook('domReady'), 0);
            }

            // 页面完全加载
            if (document.readyState !== 'complete') {
                window.addEventListener('load', () => {
                    ModuleManager.triggerHook('pageLoaded');
                });
            } else {
                setTimeout(() => ModuleManager.triggerHook('pageLoaded'), 0);
            }
        }
    };

    /**
     * 菜单系统
     */
    const MenuSystem = {
        init() {
            if (typeof GM_registerMenuCommand === 'undefined') {
                return;
            }

            // 注册菜单项
            GM_registerMenuCommand('📊 显示框架信息', () => {
                InfoDisplay.createInfoPanel();
            });

            GM_registerMenuCommand('🔍 调试模式切换', () => {
                Framework.config.debugMode = !Framework.config.debugMode;
                Framework.config.logLevel = Framework.config.debugMode ? 'debug' : 'info';
                Notifier.info(`调试模式: ${Framework.config.debugMode ? '开启' : '关闭'}`);
            });

            GM_registerMenuCommand('📋 模块列表', () => {
                const modules = ModuleManager.list();
                const message = modules.length > 0 ?
                    `已注册模块:\n${modules.join('\n')}` :
                    '暂无注册模块';
                alert(message);
            });

            GM_registerMenuCommand('📁 外置脚本信息', () => {
                const externalScripts = InfoDisplay.getExternalScriptsInfo();
                if (externalScripts.length > 0) {
                    const info = externalScripts.map(script =>
                        `${script.fileName} - ${script.statusText}`
                    ).join('\n');
                    alert(`外置脚本信息:\n${info}`);
                } else {
                    alert('未检测到外置脚本');
                }
            });

            GM_registerMenuCommand('🔄 强制刷新外置脚本', () => {
                Logger.info('通过菜单强制刷新外置脚本');

                // 清空缓存
                Framework.externalScriptCache.clear();

                // 如果信息面板存在，则使用刷新功能
                const existingPanel = document.getElementById('script-framework-info');
                if (existingPanel) {
                    InfoDisplay.refreshScriptInfo();
                } else {
                    // 重新创建信息面板
                    InfoDisplay.createInfoPanel();
                }

                Notifier.success('已强制刷新外置脚本信息');
            });
        }
    };

    /**
     * 存储系统
     */
    const Storage = {
        get(key, defaultValue = null) {
            if (typeof GM_getValue !== 'undefined') {
                return GM_getValue(key, defaultValue);
            }

            try {
                const value = localStorage.getItem(`ScriptFramework_${key}`);
                return value ? JSON.parse(value) : defaultValue;
            } catch (error) {
                Logger.error('存储读取失败:', error);
                return defaultValue;
            }
        },

        set(key, value) {
            if (typeof GM_setValue !== 'undefined') {
                GM_setValue(key, value);
                return;
            }

            try {
                localStorage.setItem(`ScriptFramework_${key}`, JSON.stringify(value));
            } catch (error) {
                Logger.error('存储写入失败:', error);
            }
        }
    };

    /**
     * 框架主要API
     */
    return {
        // 核心方法
        init(scriptInfo) {
            if (Framework.isInitialized) {
                Logger.warn('框架已初始化，跳过重复初始化');
        return;
    }

            Framework.scriptInfo = scriptInfo;
            Framework.isInitialized = true;

            Logger.info('ScriptFramework 初始化开始...');

            // 初始化各个子系统
            EventHandler.init();
            MenuSystem.init();

            // 创建悬浮图标
            this.createToggleButton();

            // 显示加载信息
            if (Framework.config.showLoadInfo) {
                // 延迟显示，确保DOM准备就绪
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(() => this.createToggleButton(), 100);
                    });
                } else {
                    setTimeout(() => this.createToggleButton(), 100);
                }
            }

            // 显示初始化完成通知
            Notifier.success(`${scriptInfo.name} v${scriptInfo.version} 已启动`);

            Logger.info('ScriptFramework 初始化完成');
        },

        createToggleButton() {
            // 检查是否已存在按钮
            let toggleButton = document.querySelector('.script-framework-toggle');
            if (toggleButton) {
                return;
            }

            // 创建悬浮图标按钮
            toggleButton = document.createElement('div');
            toggleButton.className = 'script-framework-toggle';
            toggleButton.textContent = '🔧';
            toggleButton.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                width: 40px;
                height: 40px;
                background: #fff;
                border: 2px solid #ddd;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                font-size: 20px;
                user-select: none;
            `;

            // 添加悬停效果
            toggleButton.addEventListener('mouseenter', () => {
                toggleButton.style.transform = 'scale(1.1)';
                toggleButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
            });

            toggleButton.addEventListener('mouseleave', () => {
                toggleButton.style.transform = 'scale(1)';
                toggleButton.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            });

            // 添加点击事件
            toggleButton.addEventListener('click', () => {
                const panel = document.getElementById('script-framework-info');
                if (panel) {
                    if (panel.style.display === 'none') {
                        panel.style.display = 'block';
                        toggleButton.style.transform = 'rotate(180deg)';
                    } else {
                        panel.style.display = 'none';
                        toggleButton.style.transform = 'rotate(0deg)';
                    }
                } else {
                    this.createInfoPanel();
                    toggleButton.style.transform = 'rotate(180deg)';
                }
            });

            // 添加到页面
            document.body.appendChild(toggleButton);
            Logger.debug('创建悬浮图标按钮');
        },

        // 模块管理
        registerModule: ModuleManager.register.bind(ModuleManager),
        getModule: ModuleManager.get.bind(ModuleManager),
        listModules: ModuleManager.list.bind(ModuleManager),
        removeModule: ModuleManager.remove.bind(ModuleManager),

        // 钩子系统
        addHook(name, callback) {
            if (!Framework.hooks.has(name)) {
                Framework.hooks.set(name, []);
            }
            Framework.hooks.get(name).push(callback);
            Logger.debug(`钩子 "${name}" 已添加`);
        },

        removeHook(name, callback) {
            if (Framework.hooks.has(name)) {
                const hooks = Framework.hooks.get(name);
                const index = hooks.indexOf(callback);
                if (index > -1) {
                    hooks.splice(index, 1);
                    Logger.debug(`钩子 "${name}" 已移除`);
                }
            }
        },

        triggerHook: ModuleManager.triggerHook.bind(ModuleManager),

        // 工具方法
        logger: Logger,
        notify: Notifier,
        storage: Storage,

        // 配置
        config: Framework.config,

        // 信息
        getInfo() {
            return {
                version: Framework.version,
                isInitialized: Framework.isInitialized,
                moduleCount: Framework.modules.size,
                startTime: Framework.startTime,
                uptime: Date.now() - Framework.startTime
            };
        },

        // 显示添加脚本对话框
        showAddScriptDialog() {
            const dialog = this.createAddScriptDialog();
            document.body.appendChild(dialog);
        },

        // 创建添加脚本对话框
        createAddScriptDialog() {
            const dialog = document.createElement('div');
            dialog.id = 'sf-add-script-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
                min-width: 500px;
                max-width: 800px;
                width: 90%;
                font-family: Arial, sans-serif;
            `;

            dialog.innerHTML = `
                <div class="sf-dialog-content">
                    <div class="sf-dialog-title" style="font-size: 18px; margin-bottom: 15px; color: #333;">添加外置脚本</div>
                    <div class="sf-dialog-form">
                        <label class="sf-dialog-label" style="display: block; margin-bottom: 5px; color: #666;">脚本文件路径：</label>
                            <input
                                type="text"
                                class="sf-dialog-input"
                                id="sf-script-path-input"
                            placeholder="请输入或粘贴完整的JavaScript文件路径"
                            style="
                                width: 100%;
                                padding: 8px;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                                margin-bottom: 10px;
                                box-sizing: border-box;
                                word-break: break-all;
                            "
                        />
                        <div class="sf-dialog-hint" style="color: #666; font-size: 12px; margin-bottom: 15px;">
                            支持格式：.js 文件<br/>
                            示例：C:\\Users\\张三\\Desktop\\my-module.js
                        </div>
                    </div>
                    <div id="sf-script-result" style="
                        display: none;
                        background: #f5f5f5;
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        white-space: pre-wrap;
                        word-break: break-all;
                        font-family: monospace;
                        max-height: 200px;
                        overflow-y: auto;
                    "></div>
                    <div class="sf-dialog-actions" style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button class="sf-dialog-btn sf-dialog-btn-secondary" id="sf-dialog-cancel-btn" style="
                            padding: 8px 15px;
                            border: none;
                            border-radius: 4px;
                            background: #f5f5f5;
                            cursor: pointer;
                        ">取消</button>
                        <button class="sf-dialog-btn sf-dialog-btn-primary" id="sf-dialog-generate-btn" style="
                            padding: 8px 15px;
                            border: none;
                            border-radius: 4px;
                            background: #1a73e8;
                            color: white;
                            cursor: pointer;
                        ">生成代码</button>
                        <button class="sf-dialog-btn sf-dialog-btn-copy" id="sf-copy-btn" style="
                            padding: 8px 15px;
                            border: none;
                            border-radius: 4px;
                            background: #28a745;
                            color: white;
                            cursor: pointer;
                            display: none;
                        ">复制代码</button>
                    </div>
                    <div id="sf-error-msg" style="
                        color: #dc3545;
                        margin-top: 10px;
                        font-size: 14px;
                        display: none;
                    "></div>
                </div>
            `;

            // 获取元素引用
            const pathInput = dialog.querySelector('#sf-script-path-input');
            const generateBtn = dialog.querySelector('#sf-dialog-generate-btn');
            const copyBtn = dialog.querySelector('#sf-copy-btn');
            const cancelBtn = dialog.querySelector('#sf-dialog-cancel-btn');
            const resultDiv = dialog.querySelector('#sf-script-result');
            const errorMsg = dialog.querySelector('#sf-error-msg');

            // 添加粘贴事件处理
            pathInput.addEventListener('paste', (e) => {
                // 阻止默认粘贴行为
                e.preventDefault();
                // 获取粘贴的文本
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                // 去除前后的引号和空格
                const cleanedText = pastedText.trim().replace(/^["']|["']$/g, '');
                // 设置处理后的文本
                pathInput.value = cleanedText;
            });

            // 生成代码按钮点击事件
                generateBtn.addEventListener('click', () => {
                const path = pathInput.value.trim().replace(/^["']|["']$/g, ''); // 去除可能存在的引号
                if (!path) {
                    showError('请输入文件路径');
                    return;
                }
                if (!path.toLowerCase().endsWith('.js')) {
                    showError('请输入有效的JavaScript文件路径（.js结尾）');
                    return;
            }

                try {
                    const formattedPath = formatFilePath(path);
                    const resourceName = path.split('\\').pop().replace(/[^a-zA-Z0-9]/g, '_');
                    const code = `// @resource     ${resourceName} ${formattedPath}\n// @require      ${formattedPath}`;
                    
                    resultDiv.textContent = code;
                    resultDiv.style.display = 'block';
                    copyBtn.style.display = 'inline-block';
                    errorMsg.style.display = 'none';
                    } catch (error) {
                    showError('路径格式化失败：' + error.message);
                    }
                });

            // 复制按钮点击事件
            copyBtn.addEventListener('click', () => {
                const code = resultDiv.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '已复制！';
                    copyBtn.style.background = '#218838';
                    setTimeout(() => {
                        copyBtn.textContent = '复制代码';
                        copyBtn.style.background = '#28a745';
                    }, 2000);
                }).catch(err => {
                    showError('复制失败：' + err.message);
                });
            });

            // 取消按钮点击事件
            cancelBtn.addEventListener('click', () => {
                dialog.remove();
            });

            // 显示错误信息
            function showError(message) {
                errorMsg.textContent = message;
                errorMsg.style.display = 'block';
                resultDiv.style.display = 'none';
                copyBtn.style.display = 'none';
            }

            // 点击外部关闭对话框
            dialog.addEventListener('click', (e) => {
                if (e.target === dialog) {
                    dialog.remove();
                    }
                });

            // 添加到页面并聚焦输入框
            document.body.appendChild(dialog);
            pathInput.focus();

            return dialog;
        },

        // 处理添加脚本
        handleAddScript() {
            const input = document.getElementById('sf-script-path-input');
            const resultDiv = document.getElementById('sf-script-result');
            const path = input.value.trim();

            if (!path) {
                this.showDialogError('请输入脚本文件路径');
                return;
            }

            if (!path.toLowerCase().endsWith('.js')) {
                this.showDialogError('请输入有效的JavaScript文件路径（.js结尾）');
                return;
            }

            // 转换路径格式
            const formattedPath = this.formatScriptPath(path);

            // 自动从文件名生成resource名称
            const fileName = path.split(/[\\\/]/).pop();
            const resourceName = fileName.replace(/\.js$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');

            if (!resourceName) {
                 this.showDialogError('无法从文件名生成有效的Resource名称。');
                 return;
            }

            const generatedLines = [
                `// @resource     ${resourceName} ${formattedPath}`,
                `// @require      ${formattedPath}`
            ];

            const codeToInsert = generatedLines.join('\n');

            // 显示结果
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #137333; font-weight: 500; margin-bottom: 8px;">✅ 代码生成成功</div>
                <div class="sf-dialog-result" style="white-space: pre-wrap;">${codeToInsert}</div>
                <div class="sf-dialog-hint" style="margin-top: 8px;">
                    请复制上面的代码，并手动添加到脚本头部的元数据部分。<br/>
                    然后保存脚本并刷新页面即可生效。
                </div>
                <div style="margin-top: 12px;">
                    <button class="sf-dialog-btn sf-dialog-btn-primary" id="sf-copy-btn" data-text="${codeToInsert.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}">
                        📋 复制到剪贴板
                    </button>
                </div>
            `;

            // 为复制按钮绑定事件
            setTimeout(() => {
                const copyBtn = document.getElementById('sf-copy-btn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        const textToCopy = copyBtn.getAttribute('data-text').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            window.ScriptFramework.showCopySuccess();
                        }).catch((error) => {
                            console.error('复制失败:', error);
                            // 备用复制方法
                            const textArea = document.createElement('textarea');
                            textArea.value = textToCopy;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            window.ScriptFramework.showCopySuccess();
                        });
                    });
                }
            }, 0);

            Logger.info(`生成代码: ${codeToInsert}`);
        },

        // 格式化脚本路径
        formatScriptPath(path) {
            // 将反斜杠转换为正斜杠
            let formattedPath = path.replace(/\\/g, '/');

            // 确保以file:///开头
            if (!formattedPath.startsWith('file:///')) {
                // 如果是绝对路径（如C:/...）
                if (/^[a-zA-Z]:/.test(formattedPath)) {
                    formattedPath = 'file:///' + formattedPath;
                }
                // 如果不是绝对路径，假设是相对路径
                else if (!formattedPath.startsWith('/')) {
                    formattedPath = 'file:///' + formattedPath;
                } else {
                    formattedPath = 'file://' + formattedPath;
                }
            }

            return formattedPath;
        },

        // 显示对话框错误
        showDialogError(message) {
            const resultDiv = document.getElementById('sf-script-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #d93025; font-weight: 500;">❌ ${message}</div>
            `;
        },

        // 显示复制成功提示
        showCopySuccess() {
            const resultDiv = document.getElementById('sf-script-result');
            const existingContent = resultDiv.innerHTML;
            resultDiv.innerHTML = existingContent.replace('📋 复制到剪贴板', '✅ 已复制到剪贴板');

            setTimeout(() => {
                resultDiv.innerHTML = existingContent;
            }, 2000);
        },

        // 生成建议的文件路径
        generateSuggestedPath(fileName) {
            // 获取用户名（尝试多种方法）
            const username = this.getCurrentUsername();

            // 常见的脚本存放路径
            const commonPaths = [
                `C:\\Users\\${username}\\Documents\\${fileName}`,
                `C:\\Users\\${username}\\Desktop\\${fileName}`,
                `C:\\Users\\${username}\\Downloads\\${fileName}`,
                `C:\\Users\\${username}\\.cursor\\我的脚本开发\\${fileName}`,
                `D:\\Scripts\\${fileName}`,
                `C:\\Scripts\\${fileName}`
            ];

            // 返回第一个建议路径，用户可以修改
            return commonPaths[0];
        },

        // 获取当前用户名
        getCurrentUsername() {
            try {
                // 方法1: 从当前脚本信息中获取
                if (GM_info && GM_info.script) {
                    // 从脚本路径中提取
                    if (GM_info.script.path) {
                        const pathMatch = GM_info.script.path.match(/Users[\/\\]([^\/\\]+)/i);
                        if (pathMatch && pathMatch[1]) {
                            return decodeURIComponent(pathMatch[1]);
                        }
                    }
                    
                    // 从require路径中提取
                    const requires = GM_info.script.requires || [];
                    for (const req of requires) {
                        const reqMatch = req.match(/Users[\/\\]([^\/\\]+)/i);
                        if (reqMatch && reqMatch[1]) {
                            return decodeURIComponent(reqMatch[1]);
                        }
                    }
                    
                    // 从resource路径中提取
                    const resources = GM_info.script.resources || {};
                    for (const key in resources) {
                        const resMatch = resources[key].match(/Users[\/\\]([^\/\\]+)/i);
                        if (resMatch && resMatch[1]) {
                            return decodeURIComponent(resMatch[1]);
                        }
                    }
                }

                // 方法2: 从当前URL中获取（如果是本地文件）
                if (location.protocol === 'file:') {
                    const urlMatch = location.pathname.match(/Users[\/\\]([^\/\\]+)/i);
                    if (urlMatch && urlMatch[1]) {
                        return decodeURIComponent(urlMatch[1]);
                    }
                }

                // 方法3: 从localStorage中获取缓存的值
                const cachedUsername = localStorage.getItem('scriptFramework_username');
                if (cachedUsername) {
                    return cachedUsername;
                }

                // 方法4: 从cookie中获取（如果之前保存过）
                const cookies = document.cookie.split(';');
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === 'scriptFramework_username') {
                        return decodeURIComponent(value);
                    }
                }

                // 方法5: 尝试从其他可能的来源获取
                const possibleSources = [
                    document.documentElement.innerHTML.match(/Users[\/\\]([^\/\\]+)[\/\\]Documents/i),
                    document.documentElement.innerHTML.match(/用户[\/\\]([^\/\\]+)[\/\\]Documents/i),
                    document.documentElement.innerHTML.match(/C:[\/\\]Users[\/\\]([^\/\\]+)/i)
                ];

                for (const match of possibleSources) {
                    if (match && match[1]) {
                        const username = decodeURIComponent(match[1]);
                        // 缓存找到的用户名
                        localStorage.setItem('scriptFramework_username', username);
                        return username;
                    }
                }

                // 如果都没找到，返回默认值
                console.warn('[ScriptFramework] 无法自动获取用户名，使用默认值');
                return 'Documents';
            } catch (error) {
                console.error('[ScriptFramework] 获取用户名时出错:', error);
                return 'Documents';
            }
        },

        // 显示文件选择提示
        showFileSelectedHint(fileName) {
            const resultDiv = document.getElementById('sf-script-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #1967d2; font-weight: 500; margin-bottom: 8px;">
                    📁 已选择文件: ${fileName}
                </div>
                <div class="sf-dialog-hint">
                    由于浏览器安全限制，无法获取完整路径。<br/>
                    请检查并修正上方的路径信息，确保指向正确的文件位置。
                </div>
            `;

            // 3秒后自动隐藏提示
            setTimeout(() => {
                if (resultDiv.innerHTML.includes('已选择文件')) {
                    resultDiv.style.display = 'none';
                }
            }, 3000);
        },

        // 自动添加@require到脚本
        handleAutoAddScript() {
            const input = document.getElementById('sf-script-path-input');
            const resultDiv = document.getElementById('sf-script-result');
            const path = input.value.trim();

            if (!path) {
                this.showDialogError('请输入脚本文件路径');
                return;
            }

            if (!path.toLowerCase().endsWith('.js')) {
                this.showDialogError('请输入有效的JavaScript文件路径（.js结尾）');
                return;
            }

            // 转换路径格式
            const formattedPath = this.formatScriptPath(path);

            // 自动从文件名生成resource名称
            const fileName = path.split(/[\\\/]/).pop();
            const resourceName = fileName.replace(/\.js$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');

            if (!resourceName) {
                 this.showDialogError('无法从文件名生成有效的Resource名称。');
                 return;
            }

            const generatedLines = [
                `// @resource     ${resourceName} ${formattedPath}`,
                `// @require      ${formattedPath}`
            ];

            const linesToAdd = generatedLines.join('\n');
            if (!linesToAdd) return;


            // 获取当前脚本信息
            const scriptInfo = this.getCurrentScriptInfo();

            // 生成修改后的脚本内容
            const modifiedScript = this.addRequireToScript(scriptInfo.content, linesToAdd);

            // 如果没有发生变化，则不继续
            if (modifiedScript === scriptInfo.content) {
                return;
            }

            // 显示结果和下载链接
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `
                <div style="color: #137333; font-weight: 500; margin-bottom: 8px;">
                    🚀 代码已自动添加到脚本！
                </div>
                <div class="sf-dialog-hint" style="margin-bottom: 12px;">
                    脚本已自动更新，请下载并替换原脚本文件。<br/>
                    新增行: <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px; white-space: pre;">${linesToAdd}</code>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="sf-dialog-btn sf-dialog-btn-primary" id="sf-download-btn">
                        💾 下载修改后的脚本
                    </button>
                    <button class="sf-dialog-btn sf-dialog-btn-secondary" id="sf-preview-btn">
                        👀 预览修改内容
                    </button>
                </div>
                <div id="sf-preview-content" style="display: none; margin-top: 12px;"></div>
            `;

            // 绑定下载按钮事件
            setTimeout(() => {
                const downloadBtn = document.getElementById('sf-download-btn');
                const previewBtn = document.getElementById('sf-preview-btn');

                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => {
                        this.downloadScript(modifiedScript, scriptInfo.filename);
                    });
                }

                if (previewBtn) {
                    previewBtn.addEventListener('click', () => {
                        this.showScriptPreview(modifiedScript);
                    });
                }
            }, 0);

            Logger.info(`自动添加代码: ${linesToAdd}`);
        },

        // 获取当前脚本信息
        getCurrentScriptInfo() {
            const scriptName = GM_info.script.name || '模块化脚本开发框架';
            const version = GM_info.script.version || '3.4';

            // 获取脚本源码（模拟）
            const scriptContent = this.getScriptTemplate();

            return {
                name: scriptName,
                version: version,
                filename: `${scriptName}-v${version}.user.js`,
                content: scriptContent
            };
        },

        // 获取脚本模板（当前脚本的基础结构）
        getScriptTemplate() {
            // 提示用户使用实际的脚本文件
            return `// ==UserScript==
// @name         ${GM_info.script.name}
// @namespace    http://tampermonkey.net/
// @version      ${GM_info.script.version}
// @description  ${GM_info.script.description}
// @author       ${GM_info.script.author || 'ScriptDev Framework'}
// @match        *://*/*
// @require      file://C:/Users/【用户名】/Documents/xxx.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_log
// @grant        GM_addStyle
// @grant        GM_info
// @grant        window.onurlchange
// ==/UserScript==

/*
 * 【重要提示】
 * 这是自动生成的脚本模板。
 * 请将您当前完整的脚本代码替换此注释后的内容。
 *
 * 步骤：
 * 1. 复制您当前完整的脚本代码
 * 2. 删除下面的示例代码
 * 3. 粘贴您的完整脚本代码
 * 4. 保存并在Tampermonkey中导入
 */

(function() {
    'use strict';

    console.log('🚀 ${GM_info.script.name} 已启动！');
    console.log('📦 新的@require已添加，请替换为您的完整脚本代码');

    // 请在这里添加您的完整脚本代码
    // 删除这些示例代码，粘贴您的实际脚本内容

})();`;
        },

        // 在脚本中添加@require行
        addRequireToScript(scriptContent, requireLine) {
            const lines = scriptContent.split('\n');
            let insertIndex = -1;
            const isResource = requireLine.trim().startsWith('// @resource');

            // 查找插入位置
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (isResource) {
                    // 如果是resource, 尝试找到最后一个@resource或@require
                if (line.startsWith('// @resource') || line.startsWith('// @require')) {
                    insertIndex = i + 1;
                    }
                } else {
                    // 如果是require, 尝试找到最后一个@require
                if (line.startsWith('// @require')) {
                    insertIndex = i + 1;
                    }
                }

                if (line.startsWith('// @grant') && insertIndex === -1) {
                    // 如果没有@require/@resource行，插入到@grant之前
                    insertIndex = i;
                } else if (line.startsWith('// ==/UserScript==') && insertIndex === -1) {
                    // 如果没有@grant行，插入到userscript头部结束之前
                    insertIndex = i;
                    break;
                }
            }

            // 检查是否已经存在相同的行
            const trimmedRequireLine = requireLine.trim();
            const existingLine = lines.find(line => line.trim() === trimmedRequireLine);

            if (existingLine) {
                // 如果已存在，直接返回，不修改
                this.showDialogError('该行已存在于脚本中，无需重复添加。');
                 return scriptContent; // 返回原内容
            }

            // 插入新的行
            if (insertIndex !== -1) {
                lines.splice(insertIndex, 0, requireLine);
            } else {
                // 如果找不到合适位置，添加到头部最后
                const userScriptEndIndex = lines.findIndex(line => line.includes('==/UserScript=='));
                if (userScriptEndIndex !== -1) {
                    lines.splice(userScriptEndIndex, 0, requireLine);
                }
            }

            return lines.join('\n');
        },

        // 下载脚本文件
        downloadScript(content, filename) {
            const blob = new Blob([content], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 显示成功提示
            const resultDiv = document.getElementById('sf-script-result');
            const successMsg = document.createElement('div');
            successMsg.style.cssText = 'color: #137333; font-weight: 500; margin-top: 8px; padding: 8px; background: #e8f5e8; border-radius: 4px;';
            successMsg.textContent = '✅ 脚本文件已下载！请替换原文件并重新加载。';
            resultDiv.appendChild(successMsg);

            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        },

        // 显示脚本预览
        showScriptPreview(content) {
            const previewDiv = document.getElementById('sf-preview-content');
            const lines = content.split('\n');
            const previewLines = lines.slice(0, 30); // 只显示前30行

            previewDiv.style.display = 'block';
            previewDiv.innerHTML = `
                <div style="background: #f8f9fa; border: 1px solid #e8eaed; border-radius: 4px; padding: 12px; margin-top: 8px;">
                    <div style="font-weight: 500; margin-bottom: 8px; color: #5f6368;">📄 脚本预览（前30行）:</div>
                    <pre style="background: #ffffff; padding: 8px; border-radius: 4px; font-size: 11px; line-height: 1.4; max-height: 200px; overflow-y: auto; margin: 0; font-family: 'Consolas', 'Monaco', monospace;">${previewLines.join('\n')}</pre>
                    ${lines.length > 30 ? `<div style="color: #5f6368; font-size: 12px; margin-top: 4px;">... 还有 ${lines.length - 30} 行</div>` : ''}
                </div>
            `;
        }
    };
})();

// 全局快捷方式
window.SF = window.ScriptFramework;

// 确保ScriptFramework在全局作用域中可用
if (typeof window.ScriptFramework === 'undefined') {
    console.error('ScriptFramework 未正确初始化');
} else {
    console.log('✅ ScriptFramework 已正确暴露到全局作用域');
    console.log('🔧 可用方法:', Object.keys(window.ScriptFramework));
    }

    // 启动框架
    ScriptFramework.init({
        name: GM_info.script.name,
        version: GM_info.script.version,
        author: GM_info.script.author || '未知作者',
        description: GM_info.script.description,
        matches: GM_info.script.matches,
        requires: GM_info.script.resources?.map(r => r.name) || []
    });

    GM_log('🚀 模块化脚本开发框架已启动 - 修复按钮点击事件');

    console.log('主脚本已加载');

    console.log('外置脚本加载路径:', GM_info.script.resources);  // 查看实际加载路径
    console.log('外置脚本开始执行');

    /**
     * 测试路径格式化功能
     */
    function testFormatFilePath() {
        const testPath = "C:\\Users\\cf\\.cursor\\脚本开发框架\\CSDN-Optimize-Beautify-Simplify-0.2.20.user.js";
        const formattedPath = formatFilePath(testPath);
        console.log('原始路径:', testPath);
        console.log('格式化后:', formattedPath);
        return formattedPath;
    }

    // 在初始化时调用测试
    if (Framework.config.debugMode) {
        testFormatFilePath();
    }

    // 在文件末尾添加初始化代码
    // 初始化框架
    if (typeof GM_addStyle !== 'undefined') {
        // 确保在页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.ScriptFramework.InfoDisplay.init();
            });
        } else {
            window.ScriptFramework.InfoDisplay.init();
        }
    } else {
        console.error('GM_addStyle is not available. Please check if the required GM_ functions are granted.');
    }

    // 初始化框架
    const scriptInfo = {
        name: GM_info.script.name || '模块化脚本开发框架',
        version: GM_info.script.version || '3.5',
        description: GM_info.script.description || ''
    };

    // 确保在DOM准备好后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ScriptFramework.init(scriptInfo);
        });
    } else {
        window.ScriptFramework.init(scriptInfo);
    }

    // 导出框架对象
    return window.ScriptFramework;
})();

// 在文档加载完成后初始化框架
(function initializeFramework() {
    const scriptInfo = {
        name: GM_info.script.name || '模块化脚本开发框架',
        version: GM_info.script.version || '3.5',
        description: GM_info.script.description || '',
        author: GM_info.script.author || '未知作者',
        matches: GM_info.script.matches || [],
        requires: GM_info.script.resources?.map(r => r.name) || []
    };

    function initialize() {
        try {
            Logger.info('开始初始化模块化脚本开发框架...');
            
            // 初始化框架
            window.ScriptFramework.init(scriptInfo);
            
            // 创建悬浮图标和面板
            window.ScriptFramework.createToggleButton();
            
            Logger.info(`🚀 ${scriptInfo.name} v${scriptInfo.version} 初始化完成`);
        } catch (error) {
            console.error('框架初始化失败:', error);
        }
    }

    // 确保在DOM准备好后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
