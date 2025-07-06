/**
 * 日志模块 - 提供统一的日志输出功能
 * @module logger
 */
const logger = {
    /**
     * 输出普通信息
     * @param {string} message - 日志消息
     */
    info: function(message) {
        console.log('%c[INFO] ' + message, 'color: #0099ff');
    },

    /**
     * 输出调试信息
     * @param {string} message - 日志消息
     */
    debug: function(message) {
        console.log('%c[DEBUG] ' + message, 'color: #666666');
    },

    /**
     * 输出警告信息
     * @param {string} message - 日志消息
     */
    warn: function(message) {
        console.warn('%c[WARN] ' + message, 'color: #ff9900');
    },

    /**
     * 输出错误信息
     * @param {string} message - 日志消息
     */
    error: function(message) {
        console.error('%c[ERROR] ' + message, 'color: #ff0000');
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
} else {
    window.logger = logger;
} 