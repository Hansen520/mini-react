"use strict";
/*
 * @Date: 2024-03-29 11:26:54
 * @Description: description
 */
function createElement(type, props, ...children) {
    return {
        type,
        props: Object.assign(Object.assign({}, props), { children: children.map((child) => {
                const isTextNode = typeof child === 'string' || typeof child === 'number';
                return isTextNode ? createTextNode(child) : child;
            }) })
    };
}
function createTextNode(nodeValue) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue,
            children: []
        }
    };
}
const MiniReact = {
    createElement
};
window.MiniReact = MiniReact;
