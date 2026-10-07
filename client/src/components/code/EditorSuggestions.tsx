import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface SuggestionItem {
  label: string;
  detail?: string;
  type: 'keyword' | 'method' | 'variable' | 'snippet' | 'class';
  insertText: string;
}

// Built-in dictionaries per programming language (strictly isolated)
export const LANGUAGE_SUGGESTIONS: Record<string, SuggestionItem[]> = {
  html: [
    // Common tags (inline tags paired on one line, container tags multiline)
    { label: 'div', detail: '<div>...</div> container', type: 'snippet', insertText: '<div>\n  \n</div>' },
    { label: 'span', detail: '<span>...</span> inline', type: 'snippet', insertText: '<span></span>' },
    { label: 'p', detail: '<p>...</p> paragraph', type: 'snippet', insertText: '<p></p>' },
    { label: 'h1', detail: '<h1>...</h1> heading 1', type: 'snippet', insertText: '<h1></h1>' },
    { label: 'h2', detail: '<h2>...</h2> heading 2', type: 'snippet', insertText: '<h2></h2>' },
    { label: 'h3', detail: '<h3>...</h3> heading 3', type: 'snippet', insertText: '<h3></h3>' },
    { label: 'h4', detail: '<h4>...</h4> heading 4', type: 'snippet', insertText: '<h4></h4>' },
    { label: 'h5', detail: '<h5>...</h5> heading 5', type: 'snippet', insertText: '<h5></h5>' },
    { label: 'h6', detail: '<h6>...</h6> heading 6', type: 'snippet', insertText: '<h6></h6>' },
    { label: 'button', detail: '<button class="...">...</button>', type: 'snippet', insertText: '<button class=""></button>' },
    { label: 'input', detail: '<input type="..." />', type: 'snippet', insertText: '<input type="text" placeholder="" />' },
    { label: 'img', detail: '<img src="..." alt="" />', type: 'snippet', insertText: '<img src="" alt="" />' },
    { label: 'a', detail: '<a href="...">...</a> link', type: 'snippet', insertText: '<a href=""></a>' },
    { label: 'form', detail: '<form>...</form>', type: 'snippet', insertText: '<form>\n  \n</form>' },
    { label: 'label', detail: '<label>...</label>', type: 'snippet', insertText: '<label></label>' },
    { label: 'textarea', detail: '<textarea placeholder=""></textarea>', type: 'snippet', insertText: '<textarea placeholder=""></textarea>' },
    { label: 'select', detail: '<select><option>...</select>', type: 'snippet', insertText: '<select>\n  <option value=""></option>\n</select>' },
    { label: 'option', detail: '<option value="...">...</option>', type: 'snippet', insertText: '<option value=""></option>' },
    { label: 'ul', detail: '<ul><li>...</ul> unordered list', type: 'snippet', insertText: '<ul>\n  <li></li>\n</ul>' },
    { label: 'ol', detail: '<ol><li>...</li></ol> ordered list', type: 'snippet', insertText: '<ol>\n  <li></li>\n</ol>' },
    { label: 'li', detail: '<li>...</li> list item', type: 'snippet', insertText: '<li></li>' },
    { label: 'table', detail: '<table>...</table> data table', type: 'snippet', insertText: '<table>\n  <thead>\n    <tr>\n      <th></th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td></td>\n    </tr>\n  </tbody>\n</table>' },
    { label: 'thead', detail: '<thead>...</thead>', type: 'snippet', insertText: '<thead>\n  <tr>\n    <th></th>\n  </tr>\n</thead>' },
    { label: 'tbody', detail: '<tbody>...</tbody>', type: 'snippet', insertText: '<tbody>\n  <tr>\n    <td></td>\n  </tr>\n</tbody>' },
    { label: 'tr', detail: '<tr>...</tr> table row', type: 'snippet', insertText: '<tr>\n  <td></td>\n</tr>' },
    { label: 'td', detail: '<td>...</td> table data', type: 'snippet', insertText: '<td></td>' },
    { label: 'th', detail: '<th>...</th> table header', type: 'snippet', insertText: '<th></th>' },
    { label: 'section', detail: '<section>...</section>', type: 'snippet', insertText: '<section>\n  \n</section>' },
    { label: 'header', detail: '<header>...</header>', type: 'snippet', insertText: '<header>\n  \n</header>' },
    { label: 'footer', detail: '<footer>...</footer>', type: 'snippet', insertText: '<footer>\n  \n</footer>' },
    { label: 'nav', detail: '<nav>...</nav>', type: 'snippet', insertText: '<nav>\n  \n</nav>' },
    { label: 'main', detail: '<main>...</main>', type: 'snippet', insertText: '<main>\n  \n</main>' },
    { label: 'article', detail: '<article>...</article>', type: 'snippet', insertText: '<article>\n  \n</article>' },
    { label: 'aside', detail: '<aside>...</aside>', type: 'snippet', insertText: '<aside>\n  \n</aside>' },
    { label: 'script', detail: '<script>...</script>', type: 'snippet', insertText: '<script>\n  \n</script>' },
    { label: 'style', detail: '<style>...</style>', type: 'snippet', insertText: '<style>\n  \n</style>' },
    { label: 'link', detail: '<link rel="stylesheet" ... />', type: 'snippet', insertText: '<link rel="stylesheet" href="" />' },
    { label: 'meta', detail: '<meta charset="UTF-8" />', type: 'snippet', insertText: '<meta charset="UTF-8" />' },
    { label: 'canvas', detail: '<canvas width="..." height="..."></canvas>', type: 'snippet', insertText: '<canvas id="" width="400" height="400"></canvas>' },
    { label: 'iframe', detail: '<iframe src="..."></iframe>', type: 'snippet', insertText: '<iframe src="" frameborder="0"></iframe>' },
    { label: 'video', detail: '<video controls></video>', type: 'snippet', insertText: '<video src="" controls></video>' },
    { label: 'audio', detail: '<audio controls></audio>', type: 'snippet', insertText: '<audio src="" controls></audio>' },
    { label: 'code', detail: '<code>...</code> inline code', type: 'snippet', insertText: '<code></code>' },
    { label: 'pre', detail: '<pre>...</pre> preformatted block', type: 'snippet', insertText: '<pre></pre>' },
    { label: 'strong', detail: '<strong>...</strong> bold text', type: 'snippet', insertText: '<strong></strong>' },
    { label: 'em', detail: '<em>...</em> italic emphasis', type: 'snippet', insertText: '<em></em>' },
    { label: 'hr', detail: '<hr /> horizontal rule', type: 'snippet', insertText: '<hr />' },
    { label: 'br', detail: '<br /> line break', type: 'snippet', insertText: '<br />' },
    { label: 'html5', detail: 'HTML5 Boilerplate Template', type: 'snippet', insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>' },

    // HTML Tag Attributes
    { label: 'class', detail: 'class="..." attribute', type: 'variable', insertText: 'class=""' },
    { label: 'id', detail: 'id="..." attribute', type: 'variable', insertText: 'id=""' },
    { label: 'src', detail: 'src="..." attribute', type: 'variable', insertText: 'src=""' },
    { label: 'href', detail: 'href="..." attribute', type: 'variable', insertText: 'href=""' },
    { label: 'alt', detail: 'alt="..." attribute', type: 'variable', insertText: 'alt=""' },
    { label: 'type', detail: 'type="..." attribute', type: 'variable', insertText: 'type=""' },
    { label: 'placeholder', detail: 'placeholder="..." attribute', type: 'variable', insertText: 'placeholder=""' },
    { label: 'value', detail: 'value="..." attribute', type: 'variable', insertText: 'value=""' },
    { label: 'name', detail: 'name="..." attribute', type: 'variable', insertText: 'name=""' },
    { label: 'style', detail: 'style="..." inline CSS', type: 'variable', insertText: 'style=""' },
    { label: 'target', detail: 'target="_blank" attribute', type: 'variable', insertText: 'target="_blank"' },
    { label: 'rel', detail: 'rel="noopener noreferrer"', type: 'variable', insertText: 'rel="noopener noreferrer"' },
    { label: 'onclick', detail: 'onclick="..." event handler', type: 'method', insertText: 'onclick=""' },
    { label: 'onchange', detail: 'onchange="..." event handler', type: 'method', insertText: 'onchange=""' },
    { label: 'onsubmit', detail: 'onsubmit="..." event handler', type: 'method', insertText: 'onsubmit=""' },
  ],

  css: [
    // Layout & Flexbox/Grid
    { label: 'display', detail: 'display: flex / block / grid', type: 'keyword', insertText: 'display: flex;' },
    { label: 'flex', detail: 'Flexbox centering layout snippet', type: 'snippet', insertText: 'display: flex;\nalign-items: center;\njustify-content: center;' },
    { label: 'grid', detail: 'CSS Grid responsive layout', type: 'snippet', insertText: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\ngap: 1rem;' },
    { label: 'align-items', detail: 'align-items: center / flex-start', type: 'keyword', insertText: 'align-items: center;' },
    { label: 'justify-content', detail: 'justify-content: center / space-between', type: 'keyword', insertText: 'justify-content: center;' },
    { label: 'flex-direction', detail: 'flex-direction: column / row', type: 'keyword', insertText: 'flex-direction: column;' },
    { label: 'gap', detail: 'gap: 1rem / 16px', type: 'keyword', insertText: 'gap: 1rem;' },

    // Box Model & Spacing
    { label: 'color', detail: 'Text color', type: 'keyword', insertText: 'color: ;' },
    { label: 'background', detail: 'Background style', type: 'keyword', insertText: 'background: ;' },
    { label: 'background-color', detail: 'Background color', type: 'keyword', insertText: 'background-color: ;' },
    { label: 'padding', detail: 'Inner padding', type: 'keyword', insertText: 'padding: ;' },
    { label: 'margin', detail: 'Outer margin', type: 'keyword', insertText: 'margin: ;' },
    { label: 'border', detail: 'Border style', type: 'keyword', insertText: 'border: 1px solid ;' },
    { label: 'border-radius', detail: 'Corner radius', type: 'keyword', insertText: 'border-radius: ;' },
    { label: 'width', detail: 'Box width', type: 'keyword', insertText: 'width: ;' },
    { label: 'height', detail: 'Box height', type: 'keyword', insertText: 'height: ;' },
    { label: 'max-width', detail: 'Maximum width', type: 'keyword', insertText: 'max-width: ;' },
    { label: 'min-height', detail: 'Minimum height', type: 'keyword', insertText: 'min-height: ;' },

    // Typography
    { label: 'font-size', detail: 'Font size', type: 'keyword', insertText: 'font-size: ;' },
    { label: 'font-weight', detail: 'Font weight: bold / 600', type: 'keyword', insertText: 'font-weight: ;' },
    { label: 'font-family', detail: 'Font family', type: 'keyword', insertText: 'font-family: sans-serif;' },
    { label: 'text-align', detail: 'text-align: center / left', type: 'keyword', insertText: 'text-align: center;' },
    { label: 'line-height', detail: 'Line height', type: 'keyword', insertText: 'line-height: ;' },

    // Positioning & Effects
    { label: 'position', detail: 'position: relative / absolute', type: 'keyword', insertText: 'position: relative;' },
    { label: 'absolute', detail: 'position: absolute snippet', type: 'snippet', insertText: 'position: absolute;\ntop: 0;\nleft: 0;' },
    { label: 'top', detail: 'top: 0;', type: 'keyword', insertText: 'top: 0;' },
    { label: 'left', detail: 'left: 0;', type: 'keyword', insertText: 'left: 0;' },
    { label: 'right', detail: 'right: 0;', type: 'keyword', insertText: 'right: 0;' },
    { label: 'bottom', detail: 'bottom: 0;', type: 'keyword', insertText: 'bottom: 0;' },
    { label: 'z-index', detail: 'z-index layer order', type: 'keyword', insertText: 'z-index: 10;' },
    { label: 'opacity', detail: 'Opacity level', type: 'keyword', insertText: 'opacity: ;' },
    { label: 'cursor', detail: 'cursor: pointer;', type: 'keyword', insertText: 'cursor: pointer;' },
    { label: 'box-shadow', detail: 'Drop shadow effect', type: 'keyword', insertText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);' },
    { label: 'transition', detail: 'Smooth transition', type: 'keyword', insertText: 'transition: all 0.3s ease;' },
    { label: 'transform', detail: 'CSS transform', type: 'keyword', insertText: 'transform: ;' },
    { label: 'overflow', detail: 'overflow: hidden / auto', type: 'keyword', insertText: 'overflow: hidden;' },

    // Common CSS Values
    { label: 'none', detail: 'display/border: none', type: 'variable', insertText: 'none' },
    { label: 'block', detail: 'display: block', type: 'variable', insertText: 'block' },
    { label: 'inline-block', detail: 'display: inline-block', type: 'variable', insertText: 'inline-block' },
    { label: 'relative', detail: 'position: relative', type: 'variable', insertText: 'relative' },
    { label: 'center', detail: 'align/justify: center', type: 'variable', insertText: 'center' },
    { label: 'space-between', detail: 'justify-content: space-between', type: 'variable', insertText: 'space-between' },
    { label: 'pointer', detail: 'cursor: pointer', type: 'variable', insertText: 'pointer' },
    { label: 'transparent', detail: 'color: transparent', type: 'variable', insertText: 'transparent' },
    { label: 'hidden', detail: 'overflow: hidden', type: 'variable', insertText: 'hidden' },
    { label: 'auto', detail: 'margin/width: auto', type: 'variable', insertText: 'auto' },
    { label: 'inherit', detail: 'inherit property', type: 'variable', insertText: 'inherit' },
    { label: 'cover', detail: 'background-size: cover', type: 'variable', insertText: 'cover' },
  ],

  javascript: [
    // Keywords & Declarations
    { label: 'const', detail: 'Constant variable declaration', type: 'keyword', insertText: 'const ' },
    { label: 'let', detail: 'Block-scoped variable', type: 'keyword', insertText: 'let ' },
    { label: 'var', detail: 'Function-scoped variable', type: 'keyword', insertText: 'var ' },
    { label: 'function', detail: 'Function declaration', type: 'keyword', insertText: 'function () {\n  \n}' },
    { label: 'return', detail: 'Return statement', type: 'keyword', insertText: 'return ' },
    { label: 'import', detail: 'ES Module import', type: 'keyword', insertText: 'import ' },
    { label: 'export', detail: 'ES Module export', type: 'keyword', insertText: 'export ' },
    { label: 'async', detail: 'Async function prefix', type: 'keyword', insertText: 'async ' },
    { label: 'await', detail: 'Await asynchronous promise', type: 'keyword', insertText: 'await ' },
    { label: 'class', detail: 'Class declaration', type: 'class', insertText: 'class {\n  constructor() {\n    \n  }\n}' },
    { label: 'if', detail: 'if statement', type: 'keyword', insertText: 'if () {\n  \n}' },
    { label: 'else', detail: 'else statement', type: 'keyword', insertText: 'else {\n  \n}' },
    { label: 'for', detail: 'for loop', type: 'keyword', insertText: 'for (let i = 0; i < ; i++) {\n  \n}' },
    { label: 'while', detail: 'while loop', type: 'keyword', insertText: 'while () {\n  \n}' },
    { label: 'try', detail: 'try...catch block', type: 'snippet', insertText: 'try {\n  \n} catch (error) {\n  console.error(error);\n}' },
    { label: 'switch', detail: 'switch statement', type: 'snippet', insertText: 'switch () {\n  case :\n    break;\n  default:\n}' },

    // Console & DOM
    { label: 'console.log', detail: 'Log to browser/Node console', type: 'method', insertText: 'console.log();' },
    { label: 'console.error', detail: 'Error log to console', type: 'method', insertText: 'console.error();' },
    { label: 'console.warn', detail: 'Warning log to console', type: 'method', insertText: 'console.warn();' },
    { label: 'document.getElementById', detail: 'Get DOM element by ID', type: 'method', insertText: "document.getElementById('')" },
    { label: 'document.querySelector', detail: 'Query DOM selector', type: 'method', insertText: "document.querySelector('')" },
    { label: 'document.querySelectorAll', detail: 'Query all DOM selectors', type: 'method', insertText: "document.querySelectorAll('')" },
    { label: 'document.createElement', detail: 'Create DOM element', type: 'method', insertText: "document.createElement('')" },
    { label: 'addEventListener', detail: 'Bind event listener', type: 'method', insertText: "addEventListener('', (e) => {\n  \n});" },
    { label: 'setTimeout', detail: 'Execute after delay', type: 'method', insertText: 'setTimeout(() => {\n  \n}, 1000);' },
    { label: 'setInterval', detail: 'Execute periodically', type: 'method', insertText: 'setInterval(() => {\n  \n}, 1000);' },
    { label: 'fetch', detail: 'Fetch HTTP API request', type: 'method', insertText: "fetch('').then(res => res.json())" },

    // Arrays & Objects
    { label: 'map', detail: 'Array.map transform', type: 'method', insertText: 'map((item) => )' },
    { label: 'filter', detail: 'Array.filter elements', type: 'method', insertText: 'filter((item) => )' },
    { label: 'forEach', detail: 'Array.forEach iterate', type: 'method', insertText: 'forEach((item) => {\n  \n})' },
    { label: 'reduce', detail: 'Array.reduce accumulate', type: 'method', insertText: 'reduce((acc, curr) => acc + curr, 0)' },
    { label: 'find', detail: 'Array.find element', type: 'method', insertText: 'find((item) => )' },
    { label: 'includes', detail: 'Array/String includes item', type: 'method', insertText: 'includes()' },
    { label: 'push', detail: 'Array.push item', type: 'method', insertText: 'push()' },
    { label: 'pop', detail: 'Array.pop item', type: 'method', insertText: 'pop()' },
    { label: 'length', detail: 'Array/String length', type: 'variable', insertText: 'length' },
    { label: 'JSON.stringify', detail: 'Serialize to JSON string', type: 'method', insertText: 'JSON.stringify()' },
    { label: 'JSON.parse', detail: 'Parse JSON string', type: 'method', insertText: 'JSON.parse()' },
    { label: 'Object.keys', detail: 'Object keys array', type: 'method', insertText: 'Object.keys()' },
    { label: 'Object.values', detail: 'Object values array', type: 'method', insertText: 'Object.values()' },
  ],

  typescript: [
    { label: 'interface', detail: 'Interface definition', type: 'class', insertText: 'interface  {\n  \n}' },
    { label: 'type', detail: 'Type alias definition', type: 'class', insertText: 'type  = ;' },
    { label: 'string', detail: 'Primitive string type', type: 'keyword', insertText: 'string' },
    { label: 'number', detail: 'Primitive number type', type: 'keyword', insertText: 'number' },
    { label: 'boolean', detail: 'Primitive boolean type', type: 'keyword', insertText: 'boolean' },
    { label: 'const', detail: 'Constant variable declaration', type: 'keyword', insertText: 'const ' },
    { label: 'let', detail: 'Block-scoped variable', type: 'keyword', insertText: 'let ' },
    { label: 'function', detail: 'Function declaration', type: 'keyword', insertText: 'function () {\n  \n}' },
    { label: 'return', detail: 'Return statement', type: 'keyword', insertText: 'return ' },
    { label: 'console.log', detail: 'Log to console', type: 'method', insertText: 'console.log();' },
    { label: 'Promise', detail: 'Promise<T> type', type: 'class', insertText: 'Promise<>' },
    { label: 'Array', detail: 'Array<T> type', type: 'class', insertText: 'Array<>' },
    { label: 'Record', detail: 'Record<K, V> type', type: 'class', insertText: 'Record<string, >' },
  ],

  python: [
    // Keywords & Flow
    { label: 'def', detail: 'def function_name():', type: 'snippet', insertText: 'def ():' },
    { label: 'return', detail: 'return statement', type: 'keyword', insertText: 'return ' },
    { label: 'print', detail: 'print(...) to stdout', type: 'method', insertText: 'print()' },
    { label: 'input', detail: 'input(...) read stdin', type: 'method', insertText: 'input()' },
    { label: 'class', detail: 'class ClassName:', type: 'class', insertText: 'class :' },
    { label: 'self', detail: 'self instance reference', type: 'variable', insertText: 'self.' },
    { label: 'import', detail: 'import module', type: 'keyword', insertText: 'import ' },
    { label: 'from', detail: 'from module import ...', type: 'keyword', insertText: 'from  import ' },
    { label: 'if', detail: 'if condition:', type: 'keyword', insertText: 'if :' },
    { label: 'elif', detail: 'elif condition:', type: 'keyword', insertText: 'elif :' },
    { label: 'else', detail: 'else:', type: 'keyword', insertText: 'else:' },
    { label: 'for', detail: 'for item in iterable:', type: 'keyword', insertText: 'for item in :' },
    { label: 'while', detail: 'while condition:', type: 'keyword', insertText: 'while :' },
    { label: 'break', detail: 'break loop', type: 'keyword', insertText: 'break' },
    { label: 'continue', detail: 'continue next iteration', type: 'keyword', insertText: 'continue' },
    { label: 'pass', detail: 'pass placeholder', type: 'keyword', insertText: 'pass' },

    // Built-in Functions & Collections
    { label: 'range', detail: 'range(start, stop, step)', type: 'method', insertText: 'range()' },
    { label: 'len', detail: 'len(sequence)', type: 'method', insertText: 'len()' },
    { label: 'list', detail: 'list() constructor', type: 'class', insertText: 'list()' },
    { label: 'dict', detail: 'dict() constructor', type: 'class', insertText: 'dict()' },
    { label: 'set', detail: 'set() constructor', type: 'class', insertText: 'set()' },
    { label: 'tuple', detail: 'tuple() constructor', type: 'class', insertText: 'tuple()' },
    { label: 'int', detail: 'int(x) integer cast', type: 'class', insertText: 'int()' },
    { label: 'str', detail: 'str(x) string cast', type: 'class', insertText: 'str()' },
    { label: 'float', detail: 'float(x) float cast', type: 'class', insertText: 'float()' },
    { label: 'bool', detail: 'bool(x) boolean cast', type: 'class', insertText: 'bool()' },

    // List & String Methods
    { label: 'append', detail: 'list.append(x)', type: 'method', insertText: 'append()' },
    { label: 'pop', detail: 'list.pop()', type: 'method', insertText: 'pop()' },
    { label: 'insert', detail: 'list.insert(i, x)', type: 'method', insertText: 'insert()' },
    { label: 'split', detail: 'str.split(sep)', type: 'method', insertText: 'split()' },
    { label: 'join', detail: 'str.join(iterable)', type: 'method', insertText: 'join()' },
    { label: 'strip', detail: 'str.strip() whitespace', type: 'method', insertText: 'strip()' },
    { label: 'replace', detail: 'str.replace(old, new)', type: 'method', insertText: 'replace()' },

    // Built-in Helpers
    { label: 'enumerate', detail: 'enumerate(iterable)', type: 'method', insertText: 'enumerate()' },
    { label: 'zip', detail: 'zip(iter1, iter2)', type: 'method', insertText: 'zip()' },
    { label: 'sum', detail: 'sum(iterable)', type: 'method', insertText: 'sum()' },
    { label: 'min', detail: 'min(iterable)', type: 'method', insertText: 'min()' },
    { label: 'max', detail: 'max(iterable)', type: 'method', insertText: 'max()' },
    { label: 'sorted', detail: 'sorted(iterable)', type: 'method', insertText: 'sorted()' },

    // Exception Handling & Context
    { label: 'try', detail: 'try...except block', type: 'snippet', insertText: 'try:\n    \nexcept Exception as e:\n    print(e)' },
    { label: 'except', detail: 'except Exception as e:', type: 'keyword', insertText: 'except Exception as e:' },
    { label: 'with', detail: 'with open(...) as f:', type: 'snippet', insertText: 'with open("", "r") as f:\n    ' },
    { label: 'main', detail: 'if __name__ == "__main__":', type: 'snippet', insertText: 'if __name__ == "__main__":\n    ' },
  ],

  cpp: [
    // I/O & Streams
    { label: 'cout', detail: 'std::cout << ...', type: 'method', insertText: 'cout <<  << endl;' },
    { label: 'cin', detail: 'std::cin >> ...', type: 'method', insertText: 'cin >> ;' },
    { label: 'endl', detail: 'std::endl newline', type: 'variable', insertText: 'endl' },
    { label: 'vector', detail: 'std::vector<T>', type: 'class', insertText: 'vector<>' },
    { label: 'string', detail: 'std::string', type: 'class', insertText: 'string ' },
    { label: 'int', detail: 'Integer type', type: 'keyword', insertText: 'int ' },
    { label: 'void', detail: 'Void type', type: 'keyword', insertText: 'void ' },
    { label: 'bool', detail: 'Boolean type', type: 'keyword', insertText: 'bool ' },
    { label: 'double', detail: 'Double float type', type: 'keyword', insertText: 'double ' },
    { label: 'char', detail: 'Char type', type: 'keyword', insertText: 'char ' },
    { label: 'return', detail: 'Return statement', type: 'keyword', insertText: 'return ' },
    { label: 'class', detail: 'class definition', type: 'class', insertText: 'class {\npublic:\n};\n' },
    { label: 'struct', detail: 'struct definition', type: 'class', insertText: 'struct {\n    \n};\n' },
    { label: 'public', detail: 'public access specifier', type: 'keyword', insertText: 'public:' },
    { label: 'private', detail: 'private access specifier', type: 'keyword', insertText: 'private:' },
    { label: 'push_back', detail: 'vector.push_back(...)', type: 'method', insertText: 'push_back()' },
    { label: 'size', detail: 'container.size()', type: 'method', insertText: 'size()' },
    { label: 'sort', detail: 'std::sort(...)', type: 'method', insertText: 'sort(.begin(), .end());' },
    { label: 'unordered_map', detail: 'std::unordered_map<K, V>', type: 'class', insertText: 'unordered_map<, > ' },
    { label: 'priority_queue', detail: 'std::priority_queue<T>', type: 'class', insertText: 'priority_queue<> ' },
    { label: 'include_iostream', detail: '#include <iostream>', type: 'snippet', insertText: '#include <iostream>\nusing namespace std;\n' },
    { label: 'main', detail: 'int main() { ... }', type: 'snippet', insertText: 'int main() {\n    \n    return 0;\n}' },
  ],

  java: [
    { label: 'System.out.println', detail: 'Print line to stdout', type: 'method', insertText: 'System.out.println();' },
    { label: 'System.out.print', detail: 'Print to stdout', type: 'method', insertText: 'System.out.print();' },
    { label: 'Scanner', detail: 'Scanner stdin input', type: 'class', insertText: 'Scanner sc = new Scanner(System.in);' },
    { label: 'public', detail: 'public modifier', type: 'keyword', insertText: 'public ' },
    { label: 'private', detail: 'private modifier', type: 'keyword', insertText: 'private ' },
    { label: 'protected', detail: 'protected modifier', type: 'keyword', insertText: 'protected ' },
    { label: 'static', detail: 'static modifier', type: 'keyword', insertText: 'static ' },
    { label: 'void', detail: 'void return type', type: 'keyword', insertText: 'void ' },
    { label: 'class', detail: 'class declaration', type: 'class', insertText: 'class {\n    \n}' },
    { label: 'return', detail: 'return statement', type: 'keyword', insertText: 'return ' },
    { label: 'new', detail: 'Instantiate object', type: 'keyword', insertText: 'new ' },
    { label: 'this', detail: 'this reference', type: 'keyword', insertText: 'this.' },
    { label: 'String', detail: 'java.lang.String', type: 'class', insertText: 'String ' },
    { label: 'ArrayList', detail: 'java.util.ArrayList<T>', type: 'class', insertText: 'ArrayList<> ' },
    { label: 'HashMap', detail: 'java.util.HashMap<K, V>', type: 'class', insertText: 'HashMap<, > ' },
    { label: 'main', detail: 'public static void main(...)', type: 'snippet', insertText: 'public static void main(String[] args) {\n    \n}' },
    { label: 'sout', detail: 'System.out.println() shortcut', type: 'snippet', insertText: 'System.out.println();' },
  ],

  sql: [
    { label: 'SELECT', detail: 'SELECT columns FROM ...', type: 'keyword', insertText: 'SELECT * FROM ' },
    { label: 'FROM', detail: 'FROM table_name', type: 'keyword', insertText: 'FROM ' },
    { label: 'WHERE', detail: 'WHERE condition', type: 'keyword', insertText: 'WHERE ' },
    { label: 'JOIN', detail: 'INNER JOIN table ON ...', type: 'keyword', insertText: 'JOIN  ON ' },
    { label: 'LEFT JOIN', detail: 'LEFT OUTER JOIN table ON ...', type: 'keyword', insertText: 'LEFT JOIN  ON ' },
    { label: 'GROUP BY', detail: 'GROUP BY column', type: 'keyword', insertText: 'GROUP BY ' },
    { label: 'ORDER BY', detail: 'ORDER BY column DESC', type: 'keyword', insertText: 'ORDER BY  DESC' },
    { label: 'COUNT', detail: 'COUNT(*) aggregate', type: 'method', insertText: 'COUNT(*)' },
    { label: 'SUM', detail: 'SUM(column) aggregate', type: 'method', insertText: 'SUM()' },
    { label: 'AVG', detail: 'AVG(column) aggregate', type: 'method', insertText: 'AVG()' },
    { label: 'LIMIT', detail: 'LIMIT n rows', type: 'keyword', insertText: 'LIMIT ' },
    { label: 'INSERT INTO', detail: 'INSERT INTO table VALUES(...)', type: 'snippet', insertText: 'INSERT INTO  () VALUES ();' },
    { label: 'UPDATE', detail: 'UPDATE table SET ...', type: 'snippet', insertText: 'UPDATE  SET  WHERE ;' },
    { label: 'DELETE FROM', detail: 'DELETE FROM table WHERE ...', type: 'snippet', insertText: 'DELETE FROM  WHERE ;' },
  ],
};

// Language-specific identifier extraction to prevent cross-language pollution
export function extractIdentifiersFromCode(code: string, language: string): SuggestionItem[] {
  if (!code || code.length < 5) return [];
  const words = new Set<string>();

  if (language === 'html') {
    // In HTML, only extract classes and IDs defined by the user
    const classMatches = code.matchAll(/class=["']([^"']+)["']/g);
    for (const m of classMatches) {
      m[1].split(/\s+/).forEach((c) => {
        if (c.length >= 2) words.add(c);
      });
    }
    const idMatches = code.matchAll(/id=["']([^"']+)["']/g);
    for (const m of idMatches) {
      if (m[1].length >= 2) words.add(m[1]);
    }
  } else if (language === 'css') {
    // In CSS, extract class and id selectors
    const selectors = code.matchAll(/[.#]([a-zA-Z0-9_-]+)/g);
    for (const m of selectors) {
      if (m[1].length >= 2) words.add(m[1]);
    }
  } else if (language === 'python') {
    // In Python, extract function definitions and variables
    const defMatches = code.matchAll(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);
    for (const m of defMatches) words.add(m[1]);

    const assignMatches = code.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g);
    for (const m of assignMatches) {
      if (!/^(if|for|while|return|class|def)$/.test(m[1])) {
        words.add(m[1]);
      }
    }
  } else {
    // In JS / C++ / Java, extract identifiers
    const idMatches = code.matchAll(/\b([a-zA-Z_$][a-zA-Z0-9_$]{2,})\b/g);
    for (const m of idMatches) {
      const w = m[1];
      if (!/^(true|false|null|undefined|this|that|function|const|let|var|return|class)$/.test(w)) {
        words.add(w);
      }
    }
  }

  return Array.from(words).slice(0, 30).map((w) => ({
    label: w,
    detail: 'local identifier',
    type: 'variable',
    insertText: w,
  }));
}

interface EditorSuggestionsProps {
  suggestions: SuggestionItem[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (item: SuggestionItem) => void;
  prefix: string;
}

export const EditorSuggestions: React.FC<EditorSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  prefix,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Auto scroll into view as user arrows up/down
  useEffect(() => {
    if (selectedItemRef.current && containerRef.current) {
      const container = containerRef.current;
      const item = selectedItemRef.current;
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (itemTop < containerTop) {
        container.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.clientHeight;
      }
    }
  }, [selectedIndex]);

  if (!suggestions || suggestions.length === 0) return null;

  const getTypeIcon = (type: SuggestionItem['type']) => {
    switch (type) {
      case 'keyword':
        return <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-blue-500/20 text-blue-400 select-none">k</span>;
      case 'method':
        return <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-purple-500/20 text-purple-400 select-none">m</span>;
      case 'class':
        return <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-amber-500/20 text-amber-400 select-none">c</span>;
      case 'snippet':
        return <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-emerald-500/20 text-emerald-400 select-none">s</span>;
      case 'variable':
      default:
        return <span className="w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-cyan-500/20 text-cyan-400 select-none">v</span>;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-50 min-w-[240px] max-w-[340px] max-h-[190px] overflow-y-auto rounded-md bg-[#1f2335] border border-[#3b4261] shadow-2xl font-mono text-xs py-1 select-none backdrop-blur-md"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="px-2 py-0.5 text-[10px] text-neutral-400 uppercase tracking-wider border-b border-[#292e42] flex items-center justify-between">
        <span className="text-cyan-400 font-bold">IntelliSense</span>
        <span className="text-[9px] text-neutral-400">Tab / ↵ to insert</span>
      </div>

      {suggestions.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        // Clean prefix comparison for highlighting
        const label = item.label;
        const cleanPrefix = prefix.replace(/^</, '');
        const matchLen = cleanPrefix.length;
        const matchesPrefix = label.toLowerCase().startsWith(cleanPrefix.toLowerCase());

        return (
          <div
            key={`${item.label}-${idx}`}
            ref={isSelected ? selectedItemRef : null}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
            className={cn(
              'px-2 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors text-left',
              isSelected ? 'bg-[#283457] text-white' : 'hover:bg-[#24283b] text-neutral-300'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {getTypeIcon(item.type)}
              <span className="truncate">
                {matchesPrefix && matchLen > 0 ? (
                  <>
                    <strong className="text-cyan-300 font-bold">{label.slice(0, matchLen)}</strong>
                    <span>{label.slice(matchLen)}</span>
                  </>
                ) : (
                  label
                )}
              </span>
            </div>

            {item.detail && (
              <span className={cn('text-[10px] truncate shrink-0', isSelected ? 'text-blue-200' : 'text-neutral-500')}>
                {item.detail}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
