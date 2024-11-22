(function () {
  function createElement(type, props, ...children) {
    debugger
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
    debugger
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue,
        children: [],
      },
    };
  }

  let nextUnitOfWork = null; /* 用 nextUnitOfWork 指向下一个要处理的 fiber 节点 */
  let wipRoot = null; /* 根 wipRoot */
  let currentRoot = null; /* 历史的root */
  let deletions = null;

  /* 这里做一个初始化的处理 */
  function render(element, container) {
    debugger
    /* 初始化根值 */
    wipRoot = {
      dom: container /* 绑定的根节点 */,
      props: {
        children: [element],
      },
      alternate: currentRoot /* 历史的根节点 */,
    };

    deletions = [];

    nextUnitOfWork = wipRoot;
  }

  /* reconcile 过程任务循环 */
  function workLoop(deadline) {
    debugger
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      console.log(nextUnitOfWork, 51);
      shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && wipRoot) {
      commitRoot();
    }

    requestIdleCallback(workLoop);
  }

  /* 这边进行时间切片，进行fiber的过程 */
  requestIdleCallback(workLoop);

  /* fiber指的是一个节点的信息，重新组装链表，处理每个 fiber 节点之后，会按照 child、sibling、return 的顺序返回下一个要处理的 fiber 节点 */
  function performUnitOfWork(fiber) {
    debugger
    const isFunctionComponent = fiber.type instanceof Function;
    // 对组件和普通标签进行处理
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }
    if (fiber.child) {
      return fiber.child; // 指向孩子
    }
    let nextFiber = fiber;
    // 遍历同一层级的元素，并且返回sibling
    while (nextFiber) {
      if (nextFiber.sibling) {
        return nextFiber.sibling; // 指向兄弟
      }
      nextFiber = nextFiber.return; // 指向父级
    }
  }

  let wipFiber = null;
  let stateHookIndex = null;

  function updateFunctionComponent(fiber) {
    debugger
    // 用 wipFiber 指向当前处理的 fiber（之前的 nextUnitOfWork 是指向下一个要处理的 fiber 节点
    wipFiber = fiber;
    // 下面处理些hooks的相关的信息
    stateHookIndex = 0;
    wipFiber.stateHooks = [];
    wipFiber.effectHooks = [];

    const children = [fiber.type(fiber.props)]; // ？
    console.log(children, 99);
    reconcileChildren(fiber, children);
  }

  function updateHostComponent(fiber) {
    debugger
    if (!fiber.dom) {
      // 根据是否为文本去创建是否为文本信息还是标签信息
      fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
  }

  function createDom(fiber) {
    const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);

    return dom;
  }

  const isEvent = (key) => key.startsWith("on");
  const isProperty = (key) => key !== "children" && !isEvent(key);
  const isNew = (prev, next) => (key) => prev[key] !== next[key];
  const isGone = (prev, next) => (key) => !(key in next);

  function updateDom(dom, prevProps, nextProps) {
    debugger
    //Remove old or changed event listeners
    Object.keys(prevProps)
      .filter(isEvent)
      .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
      });

    // Remove old properties
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(prevProps, nextProps))
      .forEach((name) => {
        dom[name] = "";
      });

    // Set new or changed properties
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => {
        dom[name] = nextProps[name];
      });

    // Add event listeners
    Object.keys(nextProps)
      .filter(isEvent)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      });
  }

  function reconcileChildren(wipFiber, elements) {
    debugger
    let index = 0;
    let oldFiber = wipFiber.alternate?.child;
    let prevSibling = null;

    while (index < elements.length || oldFiber != null) {
      const element = elements[index];
      let newFiber = null;
      const sameType = element?.type == oldFiber?.type;

      if (sameType) {
        newFiber = {
          type: oldFiber?.type,
          props: element.props,
          dom: oldFiber?.dom,
          return: wipFiber,
          alternate: oldFiber,
          effectTag: "UPDATE",
        };
      }
      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          return: wipFiber,
          alternate: null,
          effectTag: "PLACEMENT",
        };
      }
      if (oldFiber && !sameType) {
        oldFiber.effectTag = "DELETION";
        deletions.push(oldFiber);
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }

      // 这边拿到的是初始时候的child
      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }
  }

  function useState(initialState) {
    debugger
    const currentFiber = wipFiber;

    const oldHook = wipFiber.alternate?.stateHooks[stateHookIndex];

    const stateHook = {
      state: oldHook ? oldHook.state : initialState,
      queue: oldHook ? oldHook.queue : [],
    };

    stateHook.queue.forEach((action) => {
      stateHook.state = action(stateHook.state);
    });

    stateHook.queue = [];

    stateHookIndex++;
    wipFiber.stateHooks.push(stateHook);

    function setState(action) {
      const isFunction = typeof action === "function";

      stateHook.queue.push(isFunction ? action : () => action);

      wipRoot = {
        ...currentFiber,
        alternate: currentFiber,
      };
      nextUnitOfWork = wipRoot;
    }
    return [stateHook.state, setState];
  }

  function useEffect(callback, deps) {
    debugger
    const effectHook = {
      callback,
      deps,
      cleanup: undefined,
    };
    wipFiber.effectHooks.push(effectHook);
  }

  function commitRoot() {
    debugger
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    commitEffectHooks();
    currentRoot = wipRoot;
    wipRoot = null;
  }

  function commitWork(fiber) {
    debugger
    if (!fiber) {
      return;
    }

    let domParentFiber = fiber.return;
    while (!domParentFiber.dom) {
      domParentFiber = domParentFiber.return;
    }
    const domParent = domParentFiber.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
    } else if (fiber.effectTag === "DELETION") {
      commitDeletion(fiber, domParent);
    }

    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }

  function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      commitDeletion(fiber.child, domParent);
    }
  }

  function isDepsEqual(deps, newDeps) {
    if (deps.length !== newDeps.length) {
      return false;
    }

    for (let i = 0; i < deps.length; i++) {
      if (deps[i] !== newDeps[i]) {
        return false;
      }
    }
    return true;
  }

  function commitEffectHooks() {
    function runCleanup(fiber) {
      if (!fiber) return;

      fiber.alternate?.effectHooks?.forEach((hook, index) => {
        const deps = fiber.effectHooks[index].deps;

        if (!hook.deps || !isDepsEqual(hook.deps, deps)) {
          hook.cleanup?.();
        }
      });

      runCleanup(fiber.child);
      runCleanup(fiber.sibling);
    }

    function run(fiber) {
      if (!fiber) return;

      fiber.effectHooks?.forEach((newHook, index) => {
        if (!fiber.alternate) {
          newHook.cleanup = newHook.callback();
          return;
        }

        if (!newHook.deps) {
          newHook.cleanup = newHook.callback();
        }

        if (newHook.deps.length > 0) {
          const oldHook = fiber.alternate?.effectHooks[index];

          if (!isDepsEqual(oldHook.deps, newHook.deps)) {
            newHook.cleanup = newHook.callback();
          }
        }
      });

      run(fiber.child);
      run(fiber.sibling);
    }

    runCleanup(wipRoot);
    run(wipRoot);
  }

  const MiniReact = {
    createElement,
    render,
    useState,
    useEffect,
  };

  window.MiniReact = MiniReact;
})();
