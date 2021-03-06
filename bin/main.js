/**
 * @file rem entry
 * @author ienix(ienix@foxmail.com)
 *
 * @since 16/5/25
 */

"use strict";

var css = require('css');

var fontFilter = require('./lib/font/fontFilter.js');
var font = require('./lib/font/font.js');

var rpx2rem = require('./lib/rpx2rem.js');

module.exports = function (content, file, conf) {
    if (/(\/\*!@norem\*\/)/i.test(content)) {
        return content;
    }

    var styleSheet = css.parse(content);
    var rules = styleSheet.stylesheet.rules;

    function entry() {
        if (!rules.length) {
            // ignore file;
            return false;
        }
        return true;
    }

    if (!entry()) {
        return content;
    }

    var prefix = ['-webkit-', '-ms-', '-moz-', '-o-'];
    var styleExpr = new RegExp(
        '(' + prefix.join('|') + ')',
        'gi'
    );

    function prepare() {
        rules.forEach(function (item, index) {
            // ignore
            if (item.type !== 'rule') {
                return false;
            }

            var declarations = item.declarations;
            var exclude = conf.exclude;

            declarations.forEach(function (val, idx) {
                var value = val.value;
                var property = val.property && val.property.replace(styleExpr, '');
                var next = declarations[idx + 1] || '';

                if (/@norem\b/g.test(next.comment)
                    || !/rpx/g.test(value)
                    || exclude.indexOf(property) === 0) {

                    return false;
                }

                if (property.toLowerCase() === 'font-size'
                    && conf.fontSize2Rem === false) {
                    fontFilter.collection(item, value);
                }
                else {
                    try {
                        rules[index].declarations[idx].value = rpx2rem(value, conf);
                    }
                    catch (e) {
                        console.log('Error: ' + e.message);
                    }
                }
            });
        });

        return rules;
    }

    function post() {
        var styleResult = prepare() || [];

        var fontResult = font(fontFilter.maps() || {}, conf);
        var result = {
            type: 'stylesheet',
            stylesheet: {
                rules: styleResult
            }
        };

        fontFilter.clear();

        return css.stringify(result)
            + (fontResult ? fontResult : '');
    }

    return post();
};
