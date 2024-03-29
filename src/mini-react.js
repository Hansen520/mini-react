/*
 * @Date: 2024-03-29 11:26:54
 * @Description: description
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isTextNode = typeof child === "string" || typeof child === "number";
        return isTextNode ? createTextNode(child) : child;
      }),
    },
  };
}

function createTextNode(nodeValue) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue,
      children: [],
    },
  };
}

let nextUnitOfWork = null;
let wipRoot = null;
let currentRoot = null;

/* * render的过程，形成fiber */
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
}

/* deadline : 这个参数可以获取当前空闲时间以及回调是否在超时时间前已经执行的状态 */
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

/* * 在浏览器空闲时期被调用。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应 */
requestIdleCallback(workLoop);

/* * 处理每个 fiber 节点之后，会按照 child、sibling、return 的顺序返回下一个要处理的 fiber 节点 */
function performUnitOfWork(fiber) {
  /* * 处理函数的组件 */
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

let wipFiber = null;
let stateHookIndex = null;
/* * 更新函数组件 */
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  stateHookIndex = 0;
  wipFiber.stateHooks = [];
  wipFiber.effectHooks = [];

  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

/* * 更新原生标签 */
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}



/* createDom 的创建 */
function createDom(fiber) {
  const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

const isEvent = key => key.startsWith("on"); // 是否为事件
const isProperty = key => key !== 'children' && !isEvent(key); // 是否为属性
const isNew = (prev, next) => key => prev[key] !== next[key]; // 是否为新属性
const isGone = (prev, next) => key => !(key in next); // 是否移除

function updateDom(dom, prevProps, nextProps) {
    //Remove old or changed event listeners
    Object.keys(prevProps).filter(isEvent).filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key)).forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name])
    })
}

/* * 协调子节点 */
const MiniReact = {
    createElement,
  };
window.MiniReact = MiniReact;
