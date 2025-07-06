// ==UserScript==
// @name         TK - Tampermonkey模块化框架
// @namespace    https://github.com/cf/tk
// @version      0.1
// @description  一个用于Tampermonkey脚本模块化开发的框架
// @author       cf
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://raw.githubusercontent.com/cf/tk/main/modules/logger.js
// ==/UserScript==

(function() {
    'use strict';
    
    /**
     * 主入口函数
     */
    function init() {
        // 测试日志模块
        if (typeof logger !== 'undefined') {
            logger.info('TK框架初始化成功！');
            logger.debug('当前版本：0.1');
            logger.warn('这是一个警告消息测试');
            logger.error('这是一个错误消息测试');
        } else {
            console.error('logger模块加载失败！');
        }
    }

    // 页面加载完成后执行
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})(); 