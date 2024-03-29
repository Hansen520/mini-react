"use strict";
/*
 * @Date: 2024-03-29 11:04:13
 * @Description: description
 */
// const content = (
//   <div>
//     <Hansen>light</Hansen>
//     <a href="xxx">link</a>
//   </div>
// );
const content = MiniReact.createElement("div", null,
    MiniReact.createElement("a", { href: "xxx" }, "link"));
console.log(JSON.stringify(content, null, 2));
