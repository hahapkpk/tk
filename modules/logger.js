/**
 * TK框架日志模块
 * @module logger
 */
const logger = {
    styles: {
        info: 'color: #2196F3; font-weight: bold',
        success: 'color: #4CAF50; font-weight: bold',
        warning: 'color: #FFC107; font-weight: bold',
        error: 'color: #F44336; font-weight: bold',
        debug: 'color: #9E9E9E; font-weight: bold'
    },

    /**
     * 初始化日志模块
     */
    init() {
        console.info('%c[Logger] 日志模块初始化成功', this.styles.success);
    },

    /**
     * 输出信息日志
     * @param {...*} args - 日志参数
     */
    info(...args) {
        console.info('%c[Info]', this.styles.info, ...args);
    },

    /**
     * 输出成功日志
     * @param {...*} args - 日志参数
     */
    success(...args) {
        console.info('%c[Success]', this.styles.success, ...args);
    },

    /**
     * 输出警告日志
     * @param {...*} args - 日志参数
     */
    warn(...args) {
        console.warn('%c[Warning]', this.styles.warning, ...args);
    },

    /**
     * 输出错误日志
     * @param {...*} args - 日志参数
     */
    error(...args) {
        console.error('%c[Error]', this.styles.error, ...args);
    },

    /**
     * 输出调试日志
     * @param {...*} args - 日志参数
     */
    debug(...args) {
        console.debug('%c[Debug]', this.styles.debug, ...args);
    },

    /**
     * 输出分组日志
     * @param {string} label - 分组标签
     * @param {Function} callback - 分组内容回调函数
     */
    group(label, callback) {
        console.group(`%c[Group] ${label}`, this.styles.info);
        callback();
        console.groupEnd();
    }
};

// 注册日志模块
if (typeof window.TK !== 'undefined') {
    window.TK.moduleManager.register('logger', logger);
} else {
    console.warn('TK框架未初始化，日志模块将在框架加载后自动注册');
} 