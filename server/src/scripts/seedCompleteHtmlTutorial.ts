import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { Tutorial } from '../models/tutorial.model';
import { TutorialSubject } from '../models/tutorialSubject.model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface IChapterData {
  title: string;
  slug: string;
  track: string;
  sectionTitle: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime: number;
  excerpt: string;
  quickFacts: string;
  keyPoints: string[];
  diagramImageUrl: string;
  codeSnippet: {
    language: string;
    filename: string;
    code: string;
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  content: string;
}

const HTML_COMPLETE_CHAPTERS: IChapterData[] = [
  // SECTION 1: Foundations & Document Structure (Beginner)
  {
    title: 'Introduction to HTML & Web Fundamentals',
    slug: 'intro-html',
    track: 'html',
    sectionTitle: '1. Foundations & Document Structure',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 6,
    excerpt: 'Explore the foundations of HTML5: document lifecycle, DOCTYPE declaration, root skeleton, and DOM rendering.',
    quickFacts: 'HTML was created by Tim Berners-Lee in 1991. The current standard is HTML5, maintained by the W3C and WHATWG.',
    keyPoints: [
      'HTML stands for HyperText Markup Language and provides structural layout for web documents.',
      'The DOCTYPE declaration tells browsers to render in standard HTML5 mode without quirks.',
      'Every web document splits into a head (metadata and resources) and a body (rendered content).',
      'Browsers parse HTML linearly from top to bottom, constructing the Document Object Model (DOM).',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'index.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextEra Web Foundations</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; }
    header { background: #0f172a; color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 24px; }
    p { line-height: 1.6; }
    .badge { display: inline-block; background: #10b981; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <span class="badge">HTML5 Standard</span>
    <h1>Welcome to NextEra Web Architecture</h1>
    <p>Semantic document architecture starts with clean HTML structure.</p>
  </header>
  <main>
    <p>This document is verified, valid HTML5 running directly in modern sandboxed web view.</p>
  </main>
</body>
</html>`,
    },
    quiz: {
      question: 'What is the primary role of <!DOCTYPE html> at the beginning of an HTML file?',
      options: [
        'It links the external CSS stylesheet to the document.',
        'It instructs the browser to parse the file using modern HTML5 standard rendering mode.',
        'It imports JavaScript libraries from a CDN.',
        'It compresses the HTML file before loading.',
      ],
      correctIndex: 1,
      explanation: 'The <!DOCTYPE html> declaration ensures the web browser parses and displays the document in modern standards compliance mode rather than legacy quirks mode.',
    },
    content: `**1. What is HTML?**
HTML (HyperText Markup Language) is the universally accepted standard markup language for crafting web documents. It defines the hierarchical structure, content types, and layout relationships of every website on the Internet.

**2. Key Document Structure Components**
- **DOCTYPE Declaration**: The initial line <!DOCTYPE html> guarantees standard rendering in all modern browsers.
- **Root Element**: The <html> element wraps every node in the entire document tree and should declare a lang attribute.
- **Head Section**: The <head> element houses non-visible document metadata, character encodings, viewports, titles, and stylesheets.
- **Body Section**: The <body> element holds all user-visible elements, including headers, articles, buttons, and graphics.

**3. How Browsers Process HTML**
When a client requests a web document, the server returns raw bytes. The browser performs:
- Byte conversion into characters based on the specified charset (UTF-8).
- Tokenization of tags into opening and closing elements.
- Node creation and assembly of the hierarchical Document Object Model (DOM) tree.
- Style computation and paint rasterization on screen.

**4. Best Practices for Document Hygiene**
- Always include <meta charset="UTF-8"> as the first child of <head> to avoid encoding vulnerabilities.
- Always specify <meta name="viewport" content="width=device-width, initial-scale=1.0"> for responsive mobile readiness.
- Keep HTML strictly semantic: use HTML to describe structure and content, leaving visual styling to CSS and behavior to JavaScript.`,
  },

  // Chapter 2: HTML Elements, Tags & Attributes
  {
    title: 'HTML Elements, Tags & Global Attributes',
    slug: 'html-elements-and-attributes',
    track: 'html',
    sectionTitle: '1. Foundations & Document Structure',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 6,
    excerpt: 'Master the distinction between tags, elements, void elements, and global HTML attributes like id, class, and data-* attributes.',
    quickFacts: 'Attributes always appear in the opening tag and provide additional information or behavioral control to the element.',
    keyPoints: [
      'An element comprises the opening tag, attributes, inner content, and closing tag.',
      'Void elements (like img, br, hr, input, meta) never have closing tags and cannot wrap inner text.',
      'Global attributes such as id, class, title, hidden, and tabindex are supported across all HTML elements.',
      'Attribute values must be wrapped in double quotes for clean predictability.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'elements.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Elements & Attributes</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; line-height: 1.6; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white; }
    .highlight { background: #e0f2fe; border-left: 4px solid #0284c7; }
    .code-pill { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div id="main-card" class="card highlight" title="Primary Feature Card">
    <h2>Element Anatomy Demonstration</h2>
    <p>This paragraph contains a <span class="code-pill">span</span> element with specialized class styling.</p>
    <hr>
    <p>The horizontal line above is a self-closing void element.</p>
  </div>
</body>
</html>`,
    },
    quiz: {
      question: 'Which of the following is a self-closing (void) HTML element that does NOT require a closing tag?',
      options: ['<p>', '<hr>', '<div>', '<section>'],
      correctIndex: 1,
      explanation: 'The <hr> element is a void element in HTML; it represents a thematic break and has no closing tag or inner content.',
    },
    content: `**1. Elements versus Tags**
A tag is the opening or closing bracket notation (such as <p> and </p>). An element represents the complete structure: the start tag, attributes, inner content or child nodes, and the end tag.

**2. Void Elements in HTML5**
Void elements cannot contain any child nodes or text. Common void elements include:
- <br>: Forces a visual line break within phrasing text.
- <hr>: Represents a thematic break or separator between content sections.
- <img>: Embeds visual media via its src attribute.
- <input>: Renders interactive user form controls.
- <meta> and <link>: Declare document metadata in the head.

**3. Essential Global Attributes**
- **id**: Provides a unique identifier across the entire document. Must be unique per page.
- **class**: Assigns one or more class names used for CSS styling and DOM selection.
- **title**: Provides supplementary advisory tooltip information when hovered.
- **lang**: Specifies the primary human language of the element and its children.
- **hidden**: Boolean attribute that tells the browser not to render the element.
- **tabindex**: Determines keyboard focus order and focusability.`,
  },

  // Chapter 3: Headings, Paragraphs & Text Formatting
  {
    title: 'Headings, Paragraphs & Text Typography',
    slug: 'html-text-formatting-typography',
    track: 'html',
    sectionTitle: '1. Foundations & Document Structure',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 6,
    excerpt: 'Structure content using heading hierarchy h1 to h6, paragraphs, blockquotes, and text formatting tags.',
    quickFacts: 'Search engines heavily prioritize h1 and heading tags to understand the core topic of a web page.',
    keyPoints: [
      'Use exactly one h1 tag per web page representing the main topic.',
      'Never skip heading levels (e.g. going from h2 directly to h4 breaks screen reader outlines).',
      'The strong tag represents importance or seriousness; b is purely stylistic bolding.',
      'The em tag adds verbal emphasis; i is stylistic italicization.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'typography.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Typography & Text Structure</title>
  <style>
    body { font-family: Georgia, serif; max-width: 650px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #334155; }
    h1 { font-family: system-ui, sans-serif; font-size: 28px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { font-family: system-ui, sans-serif; font-size: 20px; color: #1e293b; margin-top: 24px; }
    blockquote { border-left: 4px solid #3b82f6; margin: 16px 0; padding-left: 16px; font-style: italic; color: #475569; }
    mark { background: #fef08a; padding: 1px 4px; border-radius: 2px; }
  </style>
</head>
<body>
  <h1>Mastering Semantic Web Typography</h1>
  <p>Good web documents rely on a <strong>clear heading hierarchy</strong> and structured prose.</p>
  
  <h2>Emphasis and Quotations</h2>
  <p>We use <mark>highlighting</mark> to guide user focus, and <em>emphasis</em> for tonal nuance.</p>
  
  <blockquote>
    "Simplicity is prerequisite for reliability."
    <cite>— Edsger W. Dijkstra</cite>
  </blockquote>
</body>
</html>`,
    },
    quiz: {
      question: 'Why is it considered bad practice to skip heading levels (e.g., placing an <h4> directly under an <h2>)?',
      options: [
        'Browsers will refuse to render the page and throw an error.',
        'It disrupts the document outline for screen readers and search engines.',
        'It causes the text to disappear in mobile browsers.',
        'It increases CSS bundle size.',
      ],
      correctIndex: 1,
      explanation: 'Skipping heading levels damages the logical document outline, making navigation confusing for screen reader users and impairing search engine indexing.',
    },
    content: `**1. Heading Hierarchy Rules**
HTML provides 6 heading levels from <h1> to <h6>:
- <h1> represents the overall document subject. Only one <h1> should be present per web page.
- <h2> divides major topical sections.
- <h3> through <h6> subdivide sub-topics within sections.
Always maintain sequential order. Do not choose heading tags for font size: use CSS for size and HTML for semantic structure.

**2. Paragraphs and Content Flow**
The <p> element defines a paragraph of text. Browsers automatically append vertical margins before and after paragraphs. Within a paragraph:
- Use <br> strictly when a line break is a meaningful part of the content (such as a postal address or poem).
- Never use repeated <br> tags to create spacing: use CSS margins or padding instead.

**3. Semantic Formatting Tags**
- **<strong>**: Signals strong importance, seriousness, or urgency.
- **<em>**: Indicates conversational stress emphasis that changes the sentence meaning.
- **<mark>**: Represents text highlighted for relevance in another context.
- **<small>**: Represents side comments, legal disclaimers, or copyright text.
- **<sub> and <sup>**: Subscript (chemical formulas like H2O) and superscript (exponents or footnotes like E=mc2).`,
  },

  // Chapter 4: Hyperlinks, Navigation & Anchor Attributes
  {
    title: 'Hyperlinks, Navigation & Anchor Attributes',
    slug: 'html-hyperlinks-and-anchors',
    track: 'html',
    sectionTitle: '2. Links, Media & Lists',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 6,
    excerpt: 'Connect documents using anchor links, relative versus absolute URLs, target attributes, security standards, and in-page bookmarks.',
    quickFacts: 'The anchor tag <a> is what makes the web a web by linking billions of decentralized documents together.',
    keyPoints: [
      'The href attribute specifies the destination URL, file, anchor identifier, or communication protocol.',
      'When using target="_blank", always pair with rel="noopener noreferrer" to prevent reverse tabnabbing security attacks.',
      'Fragment identifiers (#id) enable smooth navigation to specific sections within the same page.',
      'Mailto and tel link schemes trigger native email clients and telephone dialers.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'navigation.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hyperlinks & Navigation</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    nav { background: #1e293b; padding: 12px 18px; border-radius: 8px; margin-bottom: 24px; }
    nav a { color: #38bdf8; text-decoration: none; margin-right: 16px; font-weight: 600; font-size: 14px; }
    nav a:hover { text-decoration: underline; }
    .section-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .btn-link { display: inline-block; background: #0284c7; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <nav>
    <a href="#overview">Overview</a>
    <a href="#features">Features</a>
    <a href="mailto:support@nexteracoders.com">Contact Us</a>
  </nav>

  <div id="overview" class="section-card">
    <h2>Document Overview</h2>
    <p>Jump directly here using the in-page fragment identifier in the navbar.</p>
  </div>

  <div id="features" class="section-card">
    <h2>Secure External Linking</h2>
    <a href="https://w3.org" target="_blank" rel="noopener noreferrer" class="btn-link">
      Visit W3C Standards
    </a>
  </div>
</body>
</html>`,
    },
    quiz: {
      question: 'When opening links in a new browser tab with target="_blank", why is rel="noopener noreferrer" recommended?',
      options: [
        'It speeds up JavaScript execution.',
        'It prevents the opened page from accessing window.opener and protect user security.',
        'It forces the browser to download the file directly.',
        'It disables CSS on the destination page.',
      ],
      correctIndex: 1,
      explanation: 'Without rel="noopener", the target page could potentially execute malicious JavaScript against window.opener to redirect your legitimate page to a phishing website (known as reverse tabnabbing).',
    },
    content: `**1. Anatomy of the Anchor Element**
The <a> element defines a hyperlink. Its most critical attribute is **href** (Hypertext Reference), which points to the target destination.

**2. Relative versus Absolute Paths**
- **Absolute URLs**: Include the complete protocol and domain (e.g. https://example.com/guide). Used for external references.
- **Relative URLs**: Target resources on the same host (e.g. /about or ../images/logo.png). They adapt seamlessly across local, staging, and production domains.

**3. In-Page Bookmarks & Fragment Identifiers**
By assigning an **id** attribute to any element (such as <div id="pricing">), you can create an anchor link that scrolls directly to that element using href="#pricing".

**4. Special Protocol Links**
- **Email**: href="mailto:team@example.com?subject=Inquiry" opens the user's default desktop or mobile email application.
- **Telephone**: href="tel:+1234567890" triggers mobile cellular dialers.`,
  },

  // Chapter 5: Lists: Unordered, Ordered & Description Lists
  {
    title: 'Lists in HTML: Unordered, Ordered & Description',
    slug: 'html-lists-ordered-unordered',
    track: 'html',
    sectionTitle: '2. Links, Media & Lists',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 5,
    excerpt: 'Group information logically with bulleted unordered lists, sequenced ordered lists, and key-value description lists.',
    quickFacts: 'Nearly all navigation bars and sidebars in modern web development are built with unordered lists (ul).',
    keyPoints: [
      'Unordered lists (ul) present items without numerical hierarchy.',
      'Ordered lists (ol) convey sequential order, procedures, or priority.',
      'Description lists (dl, dt, dd) present terms and corresponding descriptions.',
      'Lists can nest within list items (li) to create multi-level directory structures.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'lists.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML Lists Showcase</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #1e293b; }
    dl { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    dt { font-weight: bold; color: #0284c7; margin-top: 8px; }
    dd { margin-left: 0; color: #475569; font-size: 14px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h2>Web Engineering Roadmap</h2>
  <ol type="1">
    <li>HTML5 Semantic Document Architecture</li>
    <li>CSS3 Box Model & Flexbox Layouts</li>
    <li>JavaScript DOM Manipulation & Events
      <ul>
        <li>Event Listeners</li>
        <li>Asynchronous Fetch API</li>
      </ul>
    </li>
  </ol>

  <h2>Web Terminology Glossary</h2>
  <dl>
    <dt>DOM</dt>
    <dd>Document Object Model: An in-memory tree representation of the HTML document.</dd>
    <dt>Semantic Element</dt>
    <dd>An element that clearly describes its meaning to both the browser and developer.</dd>
  </dl>
</body>
</html>`,
    },
    quiz: {
      question: 'Which elements are used together to construct a valid description list in HTML?',
      options: [
        '<ul>, <li>, and <dd>',
        '<dl>, <dt>, and <dd>',
        '<ol>, <dt>, and <li>',
        '<table>, <tr>, and <td>',
      ],
      correctIndex: 1,
      explanation: 'A description list uses <dl> as the container, <dt> for the definition term, and <dd> for the definition description.',
    },
    content: `**1. Unordered Lists (<ul>)**
Used when the order of items has no numerical significance. Each item is enclosed within an <li> (list item) tag. Browsers default to bulleted markers, which can be modified or removed via CSS.

**2. Ordered Lists (<ol>)**
Used when sequence matters, such as recipe steps or ranking algorithms. Attributes include:
- **type**: Sets marker style ("1", "a", "A", "i", "I").
- **start**: Defines the starting integer (e.g. start="5").
- **reversed**: Boolean attribute rendering items in descending countdown order.

**3. Description Lists (<dl>)**
Ideal for key-value pairs, glossaries, metadata displays, and FAQ sections:
- **<dl>**: Wrapper element.
- **<dt>**: Definition Term (the name or label).
- **<dd>**: Definition Description (the explanation or value).`,
  },

  // Chapter 6: Images, Visual Media & Responsive Picture Elements
  {
    title: 'Images, Figures & Responsive Picture Elements',
    slug: 'html-images-multimedia-guide',
    track: 'html',
    sectionTitle: '2. Links, Media & Lists',
    category: 'Web Development',
    level: 'Beginner',
    readingTime: 6,
    excerpt: 'Optimize image embedding with alt tags, native lazy loading, semantic figures, and the responsive picture element.',
    quickFacts: 'Missing alt attributes on images cause screen readers to read the raw file URL aloud, ruining accessibility.',
    keyPoints: [
      'The alt attribute provides crucial descriptive text for screen readers and fallback displays.',
      'Always declare explicit width and height attributes to avoid Cumulative Layout Shift (CLS).',
      'Use loading="lazy" to defer offscreen image network requests.',
      'The picture and source elements enable resolution switching and modern WebP format negotiation.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'images.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Picture Element</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    figure { margin: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    img { width: 100%; height: auto; display: block; }
    figcaption { padding: 12px; font-size: 13px; color: #64748b; background: white; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <h2>Semantic Media Presentation</h2>
  <figure>
    <img 
      src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop" 
      alt="Developer workstation displaying clean web development code on dual monitors"
      loading="lazy"
      width="600"
      height="350">
    <figcaption>Figure 1.1: Modern web development workstation with responsive code editors.</figcaption>
  </figure>
</body>
</html>`,
    },
    quiz: {
      question: 'Why should you always specify width and height attributes on <img> tags in modern HTML?',
      options: [
        'It is required by the HTML5 parser to prevent validation errors.',
        'It reserves space before the image downloads, preventing layout shifts (CLS).',
        'It compresses the image filesize automatically.',
        'It converts PNG files into WebP format on the server.',
      ],
      correctIndex: 1,
      explanation: 'Providing width and height allows browsers to calculate the aspect ratio and reserve layout space before downloading, eliminating layout shifts that frustrate users.',
    },
    content: `**1. The <img> Element**
The <img> element is an inline, void element that embeds visual raster or vector graphics. Essential attributes:
- **src**: Path to the visual asset (URL or relative path).
- **alt**: Descriptive textual alternative for visually impaired users and SEO crawlers.
- **width and height**: Aspect ratio hints that eliminate layout shifts.
- **loading="lazy"**: Native browser deferral of offscreen images.

**2. Semantic Figures & Captions**
Wrap standalone illustrations, charts, or code snippets with <figure> and accompany them with <figcaption> to provide an accessible contextual caption.

**3. Responsive Pictures with <picture>**
The <picture> element contains one or more <source> tags and one fallback <img> tag. It allows you to:
- Serve next-generation image formats (AVIF, WebP) with standard JPEG/PNG fallbacks.
- Implement art direction by serving different crops based on media queries (e.g. mobile vs desktop).`,
  },

  // Chapter 7: HTML Tables & Structured Tabular Data
  {
    title: 'HTML Tables & Structured Tabular Data',
    slug: 'html-tables-structured-data',
    track: 'html',
    sectionTitle: '3. Tables & Forms',
    category: 'Web Development',
    level: 'Intermediate',
    readingTime: 6,
    excerpt: 'Design accessible, clean tabular datasets with thead, tbody, tfoot, colspan, rowspan, and scope attributes.',
    quickFacts: 'Never use HTML tables for website layouts. Tables must strictly be reserved for tabular datasets.',
    keyPoints: [
      'A table comprises table rows (tr), header cells (th), and data cells (td).',
      'The semantic groups thead, tbody, and tfoot partition dataset headers, records, and totals.',
      'The scope attribute (col or row) on th elements establishes cell relationships for assistive tech.',
      'Colspan and rowspan span single cells across multiple columns or rows.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'table.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Structured Financial Table</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
    caption { font-weight: bold; font-size: 16px; margin-bottom: 8px; text-align: left; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    thead th { background: #0f172a; color: white; font-size: 13px; text-transform: uppercase; }
    tbody tr:hover { background: #f8fafc; }
    tfoot td { background: #f1f5f9; font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <caption>Quarterly Cloud Infrastructure Expenditure</caption>
    <thead>
      <tr>
        <th scope="col">Service</th>
        <th scope="col">Region</th>
        <th scope="col">Monthly Cost</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Compute Engine</th>
        <td>us-central1</td>
        <td>$420.00</td>
      </tr>
      <tr>
        <th scope="row">Managed Database</th>
        <td>us-east1</td>
        <td>$280.00</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total Quarterly Run-Rate</td>
        <td>$700.00</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`,
    },
    quiz: {
      question: 'Which attribute should be placed on a <th> tag to explicitly declare whether it titles a column or a row?',
      options: ['type', 'scope', 'span', 'headers'],
      correctIndex: 1,
      explanation: 'The scope attribute (scope="col" or scope="row") explicitly communicates to assistive technology whether a header cell applies to a column or a row.',
    },
    content: `**1. Table Structure Architecture**
HTML tables organize data into a grid of columns and rows:
- **<table>**: The root container element.
- **<caption>**: Accessible title summarizing the purpose of the dataset.
- **<tr>**: Table row container.
- **<th>**: Header cell containing bold descriptive titles.
- **<td>**: Standard data cell containing values.

**2. Semantic Partitioning**
Always organize table rows into semantic compartments:
- **<thead>**: Groups the header row(s).
- **<tbody>**: Encapsulates all dynamic record rows.
- **<tfoot>**: Summarizes columns (e.g. totals or averages).

**3. Spanning Cells with Colspan & Rowspan**
- **colspan="2"**: Merges a single cell horizontally across 2 columns.
- **rowspan="2"**: Merges a single cell vertically across 2 rows.`,
  },

  // Chapter 8: Forms, Inputs & Interactive Controls
  {
    title: 'Forms, Inputs & Interactive Controls',
    slug: 'html-forms-interactive-inputs',
    track: 'html',
    sectionTitle: '3. Tables & Forms',
    category: 'Web Development',
    level: 'Intermediate',
    readingTime: 7,
    excerpt: 'Collect user data safely using forms, input types, radio buttons, checkboxes, dropdowns, textareas, and fieldsets.',
    quickFacts: 'Always tie <label for="fieldId"> to its target input. Clicking the label focuses or toggles the input automatically.',
    keyPoints: [
      'The form element requires action and method (GET or POST) attributes.',
      'Every form input must possess a unique name attribute to be included in form submissions.',
      'Radio buttons sharing the same name attribute form mutually exclusive choice groups.',
      'Fieldset and legend group related inputs into accessible sub-sections.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'forms.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Form Showcase</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; color: #1e293b; }
    fieldset { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    legend { font-weight: bold; padding: 0 6px; color: #0284c7; }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    input[type="text"], input[type="email"], select, textarea { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
    button { background: #0284c7; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    button:hover { background: #0369a1; }
  </style>
</head>
<body>
  <h2>Developer Account Registration</h2>
  <form action="/api/register" method="POST">
    <fieldset>
      <legend>Account Credentials</legend>
      <div class="form-group">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" placeholder="e.g. dev_sarah" required>
      </div>
      <div class="form-group">
        <label for="email">Work Email:</label>
        <input type="email" id="email" name="email" placeholder="sarah@company.com" required>
      </div>
    </fieldset>
    <button type="submit">Complete Registration</button>
  </form>
</body>
</html>`,
    },
    quiz: {
      question: 'What is the purpose of tying a <label for="inputId"> element to an input with matching id?',
      options: [
        'It changes the color of the input border automatically.',
        'It connects label text to the input for accessibility and allows clicking the label to focus the input.',
        'It sends the label text to the server during submission.',
        'It prevents the user from typing numbers.',
      ],
      correctIndex: 1,
      explanation: 'Connecting labels via the "for" attribute pairs them programmatically for screen readers and expands the tap/click hit target for users.',
    },
    content: `**1. The Form Lifecycle**
The <form> element defines an interactive boundary for data entry:
- **action**: The target endpoint URL where form data is transmitted.
- **method**: HTTP verb, typically **GET** (appends data to query parameters) or **POST** (packages data in request body).
- **enctype**: For file uploads, multipart/form-data must be specified.

**2. Form Field Essentials**
Every input field must provide:
- A unique **id** for DOM scripting and label connection.
- A **name** attribute that identifies the key transmitted in the form payload.
- An associated **<label>** element for accessibility.

**3. Standard Input Controls**
- Textual: type="text", type="email", type="password", type="number", type="tel".
- Choices: type="radio" (single selection within a group) and type="checkbox" (multiple independent toggles).
- Multiline: <textarea rows="4"> for extended descriptions or code.
- Dropdowns: <select> with nested <option> tags.`,
  },

  // Chapter 9: HTML5 Form Validation & Modern Input Types
  {
    title: 'HTML5 Form Validation & Modern Input Types',
    slug: 'html-form-validation-html5',
    track: 'html',
    sectionTitle: '3. Tables & Forms',
    category: 'Web Development',
    level: 'Intermediate',
    readingTime: 6,
    excerpt: 'Utilize declarative browser form validation, regular expression patterns, datalists, color pickers, and range sliders.',
    quickFacts: 'HTML5 native validation runs directly inside the browser before any JavaScript executes.',
    keyPoints: [
      'The required attribute prevents submission when an input is left blank.',
      'The pattern attribute validates text inputs against custom JavaScript regular expressions.',
      'Datalist elements supply auto-complete suggestions while still allowing custom entries.',
      'CSS pseudo-classes :valid and :invalid reflect validation states in real time.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'validation.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML5 Constraint Validation</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; color: #1e293b; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    input { width: 100%; padding: 8px 12px; border: 2px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    input:focus { outline: none; border-color: #3b82f6; }
    input:user-invalid { border-color: #ef4444; background: #fef2f2; }
    input:user-valid { border-color: #10b981; }
    button { background: #0f172a; color: white; border: none; padding: 10px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Flight Booking & Validation</h2>
  <form action="/book" method="POST">
    <div class="form-group">
      <label for="airport">Departure Airport (Auto-suggest):</label>
      <input list="airports" id="airport" name="airport" placeholder="Type city or code..." required>
      <datalist id="airports">
        <option value="JFK - New York">
        <option value="LHR - London Heathrow">
        <option value="DEL - New Delhi">
        <option value="HND - Tokyo Haneda">
      </datalist>
    </div>
    <div class="form-group">
      <label for="tickets">Number of Passengers (1 to 8):</label>
      <input type="number" id="tickets" name="tickets" min="1" max="8" value="1" required>
    </div>
    <button type="submit">Verify & Book</button>
  </form>
</body>
</html>`,
    },
    quiz: {
      question: 'Which HTML attribute allows developers to define a custom Regular Expression pattern to validate an input?',
      options: ['regex', 'pattern', 'validate', 'match'],
      correctIndex: 1,
      explanation: 'The pattern attribute accepts a regular expression string that user input must conform to in order to satisfy browser validation.',
    },
    content: `**1. Declarative Validation Attributes**
HTML5 provides native validation without external libraries:
- **required**: Mandates input presence.
- **minlength and maxlength**: Constrain string length.
- **min and max**: Constrain numeric or calendar ranges.
- **step**: Determines numeric increment granularity.
- **pattern**: Applies a regular expression constraint (e.g. pattern="[0-9]{5}" for 5-digit zip codes).

**2. Modern Specialized Inputs**
- type="range": Renders a smooth visual slider.
- type="color": Opens native OS color picker palette.
- type="date", type="time": Renders standardized calendar date and time pickers.
- type="search": Optimized for query entry with clear buttons.

**3. Predictive Autocompletion with <datalist>**
A <datalist> pairs with an <input list="listId"> to offer drop-down recommendations while preserving the ability for users to enter freeform text.`,
  },

  // Chapter 10: HTML5 Semantic Architecture & Layouts
  {
    title: 'HTML5 Semantic Architecture & Document Outline',
    slug: 'core-concepts-html',
    track: 'html',
    sectionTitle: '4. Semantic Architecture & Layouts',
    category: 'Web Development',
    level: 'Intermediate',
    readingTime: 7,
    excerpt: 'Architect accessible, modern web interfaces using header, nav, main, section, article, aside, and footer landmarks.',
    quickFacts: 'Semantic HTML directly improves Search Engine Optimization (SEO) and makes websites accessible to screen readers.',
    keyPoints: [
      'Semantic tags communicate meaning and roles to browsers, crawlers, and assistive technologies.',
      'The main element must be unique to each document and contain primary page content.',
      'Article tags represent self-contained, syndicate-ready syndications like blog posts or products.',
      'Aside holds complementary secondary content like related links or sidebars.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'semantic.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Semantic Portal Layout</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f1f5f9; color: #1e293b; }
    header { background: #0f172a; color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 16px; }
    nav a { color: #38bdf8; text-decoration: none; margin-right: 12px; font-weight: 600; }
    .layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    article { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    aside { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    footer { margin-top: 16px; padding: 16px; text-align: center; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <header>
    <h1>NextEra Engineering Journal</h1>
    <nav aria-label="Primary Navigation">
      <a href="#">Articles</a>
      <a href="#">Tutorials</a>
      <a href="#">Compilers</a>
    </nav>
  </header>

  <div class="layout">
    <main>
      <article>
        <h2>Clean Web Architecture with HTML5</h2>
        <p>Semantic elements eliminate unnecessary div wrappers and enhance document clarity.</p>
      </article>
    </main>

    <aside aria-label="Related Topics">
      <h3>Recommended Reading</h3>
      <p>Explore CSS Grid layouts and modern flex containers.</p>
    </aside>
  </div>

  <footer>
    <p>&copy; 2026 NextEra Coders. Built with semantic HTML5 standards.</p>
  </footer>
</body>
</html>`,
    },
    quiz: {
      question: 'Which HTML5 element represents self-contained content that could theoretically be syndicated independently (e.g. in RSS feeds)?',
      options: ['<div>', '<section>', '<article>', '<aside>'],
      correctIndex: 2,
      explanation: 'The <article> element is intended for autonomous, self-contained compositions like a blog post, news story, or forum thread.',
    },
    content: `**1. The Purpose of Semantic Elements**
Before HTML5, web documents were composed almost entirely of generic <div> tags with custom class names (<div class="header">, <div class="footer">). Semantic HTML replaces generic wrappers with elements that convey unambiguous meaning to both developers and machines.

**2. Key Structural Landmarks**
- **<header>**: Introductory content or navigational aids for a page or article.
- **<nav>**: Section designating major navigation links.
- **<main>**: The dominant content of the document. Only one visible <main> element may exist per document.
- **<section>**: A thematic grouping of content, typically with a heading.
- **<article>**: Self-contained, independently distributable content.
- **<aside>**: Content tangentially related to the content around it (sidebars, callouts, footnotes).
- **<footer>**: Footer for its nearest section or page containing author, legal, or sitemap info.`,
  },

  // Chapter 11: Block vs Inline Elements & Document Flow
  {
    title: 'Block vs Inline Elements & Normal Document Flow',
    slug: 'html-block-vs-inline-flow',
    track: 'html',
    sectionTitle: '4. Semantic Architecture & Layouts',
    category: 'Web Development',
    level: 'Intermediate',
    readingTime: 5,
    excerpt: 'Understand normal document flow, visual layout boxes, block containers versus inline phrasing elements, and valid nesting rules.',
    quickFacts: 'Block elements always begin on a new line and stretch horizontally to fill the parent width by default.',
    keyPoints: [
      'Block elements (div, p, h1, section) take 100% available width and stack vertically.',
      'Inline elements (span, a, strong, em) only occupy the space needed by their inner content.',
      'In normal document flow, you should not nest a block-level container inside an inline element.',
      'The display property in CSS allows modifying an element default flow behavior.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'flow.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Block vs Inline Flow</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; }
    .block-box { background: #dbeafe; border: 2px solid #3b82f6; padding: 12px; margin-bottom: 12px; border-radius: 6px; }
    .inline-badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
  </style>
</head>
<body>
  <h2>Document Flow Demonstration</h2>
  <div class="block-box">
    <strong>Block Element:</strong> Stretches to fill the entire horizontal width and begins on a new line.
  </div>
  <p>
    This paragraph contains multiple 
    <span class="inline-badge">Inline Badges</span> and 
    <span class="inline-badge">Inline Spans</span> 
    that flow horizontally alongside adjacent words.
  </p>
</body>
</html>`,
    },
    quiz: {
      question: 'Which of the following elements is inline by default in standard HTML5 flow?',
      options: ['<article>', '<p>', '<span>', '<div>'],
      correctIndex: 2,
      explanation: 'The <span> element is an inline phrasing container. It only occupies the width of its text content and does not force line breaks.',
    },
    content: `**1. What is Normal Document Flow?**
Normal flow is the default mechanism browsers use to position elements on screen before any CSS layout rules (such as Flexbox or Grid) are applied.

**2. Block-Level Characteristics**
- Begins automatically on a new line below preceding elements.
- Expands to take up the full available width of its parent container.
- Respects top and bottom margins and paddings.
- Common examples: <div>, <p>, <h1>-<h6>, <header>, <section>, <ul>, <table>.

**3. Inline-Level Characteristics**
- Sits alongside other inline content on the same line without breaking flow.
- Only expands to the dimensions of its inner content.
- Vertical margins and padding do not displace surrounding text lines.
- Common examples: <span>, <a>, <strong>, <em>, <img>, <code>.`,
  },

  // Chapter 12: HTML5 Audio, Video, Iframes & Embedded Media
  {
    title: 'HTML5 Audio, Video, Iframes & Embedded Media',
    slug: 'html-audio-video-iframes',
    track: 'html',
    sectionTitle: '5. Media, APIs, SEO & Accessibility',
    category: 'Web Development',
    level: 'Advanced',
    readingTime: 6,
    excerpt: 'Embed native video and audio streams, sandboxed iframes, and cross-origin multimedia with controls and fallback sources.',
    quickFacts: 'HTML5 eliminated the need for third-party Flash plugins by adding native audio and video elements directly into the browser.',
    keyPoints: [
      'The video tag supports controls, autoplay, muted, loop, and poster image attributes.',
      'Always supply multiple source tags (MP4, WebM) inside video/audio elements for cross-browser support.',
      'The iframe element embeds external documents; always use the sandbox attribute for untrusted third-party widgets.',
      'Autoplaying video requires the muted attribute on almost all modern mobile and desktop browsers.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'media.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Embedded Media & Sandboxing</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #1e293b; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white; }
    iframe { width: 100%; height: 180px; border: 1px solid #e2e8f0; border-radius: 6px; }
  </style>
</head>
<body>
  <h2>Embedded Multimedia Architecture</h2>
  <div class="card">
    <h3>Sandboxed HTML5 Embedded Document</h3>
    <iframe 
      title="Sandboxed Frame"
      srcdoc="<h2 style='font-family:sans-serif;color:#0284c7'>Embedded Sandboxed Document</h2><p style='font-family:sans-serif;'>Running isolated inside iframe security boundary.</p>"
      sandbox="allow-scripts">
    </iframe>
  </div>
</body>
</html>`,
    },
    quiz: {
      question: 'Why do modern browsers prevent videos with the autoplay attribute from playing automatically unless muted is also added?',
      options: [
        'To prevent audio distortion on phone speakers.',
        'To protect user experience by blocking intrusive and unexpected sound.',
        'Because unmuted video requires WebGL hardware acceleration.',
        'Because video codecs cannot decode audio without user gestures.',
      ],
      correctIndex: 1,
      explanation: 'Modern browsers enforce strict autoplay policies to prevent unexpected noise that disrupts the user experience; muted videos are allowed to autoplay safely.',
    },
    content: `**1. Native HTML5 Video Element**
The <video> element embeds video streams natively without plugins:
- **controls**: Displays browser standard play, pause, volume, and fullscreen buttons.
- **poster**: URL of a thumbnail image displayed before playback begins.
- **muted**: Mutes initial audio (required for autoplay policies).
- **preload**: Hints whether the file should buffer in the background ("none", "metadata", "auto").

**2. Native Audio Playback**
The <audio> element functions identically, accepting multiple child <source> elements (MP3, OGG, WAV) to ensure universal device compatibility.

**3. Sandboxing Iframes for Security**
The <iframe> element embeds another HTML document inside the current page. Always specify:
- **title**: Mandatory for accessibility screen readers.
- **sandbox**: Restricts what the embedded page can execute (e.g. sandbox="allow-scripts").`,
  },

  // Chapter 13: HTML5 Canvas, Inline SVG & Vector Graphics
  {
    title: 'HTML5 Canvas, Inline SVG & Vector Graphics',
    slug: 'html-canvas-svg-graphics',
    track: 'html',
    sectionTitle: '5. Media, APIs, SEO & Accessibility',
    category: 'Web Development',
    level: 'Advanced',
    readingTime: 7,
    excerpt: 'Create resolution-independent vector diagrams with inline SVG and procedural raster graphics with the HTML5 canvas element.',
    quickFacts: 'SVG graphics use mathematical vectors that scale infinitely without pixelation, whereas Canvas operates on a bitmap pixel grid.',
    keyPoints: [
      'Inline SVG is fully part of the DOM: its elements can be styled with CSS and manipulated with JavaScript.',
      'Common SVG elements include rect, circle, line, path, text, and polygon.',
      'The HTML5 canvas element provides a scriptable pixel buffer for high-frequency games and charts.',
      'Use SVG for resolution-independent icons and UI diagrams; use Canvas for intensive 60fps animations.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'graphics.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vector & Canvas Graphics</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: white; }
    svg { background: #f8fafc; border-radius: 6px; display: block; }
  </style>
</head>
<body>
  <h2>Vector & Procedural Graphics</h2>
  
  <div class="card">
    <h3>Inline Scalable Vector Graphics (SVG)</h3>
    <svg width="100%" height="120" viewBox="0 0 400 120">
      <rect x="10" y="10" width="100" height="100" rx="8" fill="#3b82f6" />
      <circle cx="180" cy="60" r="45" fill="#10b981" />
      <text x="245" y="65" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0f172a">NextEra Vector</text>
    </svg>
  </div>
</body>
</html>`,
    },
    quiz: {
      question: 'What is a major advantage of using inline SVG over traditional raster image files (like PNG or JPEG)?',
      options: [
        'SVG files only work on mobile devices.',
        'SVG elements are part of the DOM, infinitely scalable, and stylable directly with CSS.',
        'SVG cannot be animated.',
        'SVG files do not require closing tags.',
      ],
      correctIndex: 1,
      explanation: 'Because inline SVG lives inside the DOM, its paths and shapes scale infinitely without quality loss and can be targeted with CSS and JavaScript.',
    },
    content: `**1. Scalable Vector Graphics (SVG)**
SVG is an XML-based vector image format. Because it describes shapes mathematically rather than as pixel grids:
- It maintains crisp rendering at any resolution or screen zoom level.
- Elements can be styled with CSS (fill, stroke, opacity).
- Elements can attach DOM event listeners (click, hover).

**2. Key SVG Elements**
- **<svg>**: Root wrapper defining width, height, and viewBox coordinates.
- **<rect>**: Renders rectangles and rounded cards via rx/ry attributes.
- **<circle>**: Renders circles defined by center (cx, cy) and radius (r).
- **<path>**: Renders arbitrary vector paths using coordinate commands.
- **<text>**: Renders searchable, accessible text inside the graphic.

**3. The HTML5 <canvas> Element**
Unlike SVG, the <canvas> element is a resolution-dependent pixel raster surface. You obtain a 2D rendering context in JavaScript and execute draw commands for charts, games, and procedural simulations.`,
  },

  // Chapter 14: Head Metadata, Open Graph, SEO & Performance
  {
    title: 'Head Metadata, Open Graph, SEO & Performance',
    slug: 'html-head-metadata-seo',
    track: 'html',
    sectionTitle: '5. Media, APIs, SEO & Accessibility',
    category: 'Web Development',
    level: 'Advanced',
    readingTime: 6,
    excerpt: 'Configure viewport scaling, Open Graph social share cards, search engine robots directives, and preloading performance hints.',
    quickFacts: 'Open Graph meta tags determine the visual card image, title, and description when a URL is shared on Twitter, LinkedIn, or Slack.',
    keyPoints: [
      'The title tag is the single most critical on-page SEO metadata element.',
      'Open Graph (og:) tags control social media rich unfurls and visual preview cards.',
      'Resource hints like rel="preload" and rel="preconnect" shave critical milliseconds off page load times.',
      'The viewport meta tag instructs mobile browsers to render at native device scale rather than zoomed-out desktop scale.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'head.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Head Template — NextEra Coders</title>
  <meta name="description" content="Production-ready metadata architecture for high performance web applications.">
  <meta name="robots" content="index, follow">

  <!-- Open Graph Protocol for Social Previews -->
  <meta property="og:title" content="Enterprise Web Architecture">
  <meta property="og:description" content="Learn modern HTML5 semantic architecture.">
  <meta property="og:image" content="https://example.com/social-card.png">
  <meta property="og:type" content="article">

  <!-- Performance Resource Hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</head>
<body style="font-family:system-ui,sans-serif;padding:24px;">
  <h2>Inspect Document Head Metadata</h2>
  <p>This document includes a complete production suite of SEO, Open Graph, and performance resource hints.</p>
</body>
</html>`,
    },
    quiz: {
      question: 'Which link relation value instructs the browser to download a high-priority asset (like a primary font or hero image) immediately?',
      options: ['rel="stylesheet"', 'rel="preload"', 'rel="prefetch"', 'rel="alternate"'],
      correctIndex: 1,
      explanation: 'The rel="preload" attribute informs the browser that a resource is needed immediately for the current page, initiating early fetching before normal parser discovery.',
    },
    content: `**1. The Essential Head Structure**
The <head> element houses information about the document that is not displayed on screen:
- **<meta charset="UTF-8">**: Declares universal UTF-8 character encoding.
- **<meta name="viewport" content="width=device-width, initial-scale=1.0">**: Controls the layout viewport on mobile devices.
- **<title>**: Displayed in browser tabs, bookmarks, and search engine SERP listings.
- **<meta name="description">**: Summarizes page content in search results.

**2. Open Graph Protocol (OG)**
Created by Facebook and supported universally (Twitter, LinkedIn, Discord, Slack), Open Graph meta tags specify:
- og:title: Headline when shared.
- og:description: One or two sentence synopsis.
- og:image: Canonical 1200x630 visual preview banner.
- og:url: Canonical URL identifier.

**3. Performance Resource Hints**
- **preload**: High-priority download of critical assets (fonts, hero images) needed right away.
- **prefetch**: Low-priority background download of assets likely needed on subsequent pages.
- **preconnect**: Establishes early TCP handshake and TLS negotiation with critical third-party origins.`,
  },

  // Chapter 15: HTML5 Web Storage, Data Attributes & Modern APIs
  {
    title: 'HTML5 Web Storage, Data Attributes & Modern APIs',
    slug: 'html5-apis-storage-modern',
    track: 'html',
    sectionTitle: '5. Media, APIs, SEO & Accessibility',
    category: 'Web Development',
    level: 'Advanced',
    readingTime: 6,
    excerpt: 'Store client data with localStorage, attach custom metadata via data-* attributes, and explore contenteditable and drag-and-drop.',
    quickFacts: 'Data attributes provide a standard, valid way to store custom application state directly on DOM elements without invalid HTML.',
    keyPoints: [
      'Custom data attributes always begin with the prefix data- and can be read via dataset in JavaScript.',
      'The contenteditable attribute turns any HTML element into a rich live text editor.',
      'The draggable attribute enables native HTML5 drag and drop event lifecycles.',
      'Web Storage (localStorage and sessionStorage) stores key-value strings on the client without sending cookies on every request.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'apis.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HTML5 APIs & Storage</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; color: #1e293b; }
    .editable-card { border: 2px dashed #94a3b8; border-radius: 8px; padding: 16px; background: #f8fafc; outline: none; }
    .editable-card:focus { border-color: #3b82f6; background: white; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-bottom: 8px; }
  </style>
</head>
<body>
  <h2>Live ContentEditable Card</h2>
  <span class="badge">Click Text Below to Edit In-Place</span>
  <div class="editable-card" contenteditable="true" data-author="NextEra" data-status="draft">
    Click here and edit this paragraph directly in your browser. This demonstrates the native HTML5 contenteditable capability.
  </div>
</body>
</html>`,
    },
    quiz: {
      question: 'How do you define a valid custom data attribute on an HTML element (e.g. storing an author ID)?',
      options: ['custom-author="42"', 'data-author="42"', 'attr:author="42"', 'id-author="42"'],
      correctIndex: 1,
      explanation: 'All custom HTML data attributes must begin with the "data-" prefix, which maps directly to element.dataset in JavaScript.',
    },
    content: `**1. Custom Data Attributes (data-*)**
Custom data attributes store arbitrary private data directly on DOM nodes:
- Syntax: data-attribute-name="value".
- DOM Access: In JavaScript, an attribute like data-user-role is accessed cleanly via element.dataset.userRole.
- CSS Styling: Can be targeted in CSS using attribute selectors (e.g. [data-status="active"]).

**2. The contenteditable Attribute**
Setting contenteditable="true" on any element transforms it into an in-place editable rich text container without requiring form inputs or external editor libraries.

**3. Web Storage in HTML5**
HTML5 introduced client-side storage mechanisms:
- **localStorage**: Stores data with no expiration time; persists across browser sessions.
- **sessionStorage**: Stores data for the duration of the page session (cleared when the browser tab closes).
Unlike HTTP cookies, Web Storage data is never transmitted across the network automatically.`,
  },

  // Chapter 16: Web Accessibility (a11y), ARIA Roles & Quality Standards
  {
    title: 'Web Accessibility (a11y), ARIA Roles & Standards',
    slug: 'html-accessibility-aria-standards',
    track: 'html',
    sectionTitle: '5. Media, APIs, SEO & Accessibility',
    category: 'Web Development',
    level: 'Advanced',
    readingTime: 7,
    excerpt: 'Build accessible web applications adhering to WCAG 2.2 principles, WAI-ARIA roles, keyboard focus management, and skip links.',
    quickFacts: 'The first rule of ARIA: Do not use ARIA if a native HTML5 element or attribute already exists that accomplishes the same goal.',
    keyPoints: [
      'Semantic HTML is the most effective and durable foundation of web accessibility.',
      'WAI-ARIA roles, states, and properties supply assistive devices with context when native HTML elements fall short.',
      'Provide visible keyboard focus states and never disable outline:none without an accessible alternative.',
      'Skip links allow keyboard users to bypass long navigation headers directly to main content.',
    ],
    diagramImageUrl: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=1200&auto=format&fit=crop',
    codeSnippet: {
      language: 'html',
      filename: 'accessibility.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessible Web Design Patterns</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; color: #1e293b; }
    .skip-link { position: absolute; top: -40px; left: 0; background: #0f172a; color: white; padding: 8px 16px; font-weight: bold; border-radius: 4px; text-decoration: none; z-index: 100; transition: top 0.2s; }
    .skip-link:focus { top: 10px; }
    .modal-card { border: 2px solid #0284c7; border-radius: 8px; padding: 20px; background: white; margin-top: 20px; }
    button { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
    button:focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
  </style>
</head>
<body>
  <!-- Accessible Skip Link for Keyboard Users -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header>
    <h1>Accessible Interface Standards</h1>
  </header>

  <main id="main-content">
    <div class="modal-card" role="region" aria-labelledby="dialog-title">
      <h2 id="dialog-title">Accessible Dialog Region</h2>
      <p>This region uses aria-labelledby so screen readers announce the exact header upon entry.</p>
      <button type="button" aria-label="Confirm Action and Close">Confirm</button>
    </div>
  </main>
</body>
</html>`,
    },
    quiz: {
      question: 'What is the First Rule of ARIA in modern web development?',
      options: [
        'Add aria-label to every single HTML element.',
        'Use ARIA roles instead of semantic HTML5 tags.',
        'If you can use a native HTML element or attribute with the semantics and behavior already built-in, do not use ARIA.',
        'Never test accessibility with keyboard navigation.',
      ],
      correctIndex: 2,
      explanation: 'The primary rule of ARIA emphasizes that native HTML elements (like <button>, <nav>, <header>) should always be preferred over adding ARIA attributes to generic divs.',
    },
    content: `**1. The Four WCAG Principles (POUR)**
The Web Content Accessibility Guidelines (WCAG 2.2) mandate that digital content must be:
- **Perceivable**: Information must be presentable to users in ways they can perceive (e.g. alt text for images, captions for video).
- **Operable**: Interface components must be navigable and operable using keyboards alone.
- **Understandable**: Content and controls must be clear, predictable, and forgiving of user errors.
- **Robust**: Content must interpret reliably across varied user agents and assistive technologies.

**2. The Role of WAI-ARIA**
Accessible Rich Internet Applications (ARIA) provides extra attributes to describe complex widgets when native HTML lacks equivalent semantics:
- **Roles**: Describe what an element is (role="dialog", role="tablist", role="alert").
- **States & Properties**: Describe current conditions (aria-expanded="false", aria-hidden="true", aria-checked="mixed").
- **Labels**: Provide screen-reader-only labels (aria-label="Close dialog").

**3. Keyboard Navigation & Skip Links**
All interactive elements must be focusable via the Tab key. A "Skip to content" link placed at the very top of the body enables keyboard and switch users to bypass repetitive navigation bars with a single keystroke.`,
  },
];

async function seedCompleteHtml() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/nextera_coders_dev';
  console.log('Connecting to database:', uri);
  await mongoose.connect(uri);

  console.log(`Starting to seed ${HTML_COMPLETE_CHAPTERS.length} comprehensive HTML chapters...`);

  // Find an admin user to assign as author
  let authorId = new mongoose.Types.ObjectId();
  const adminUser = await mongoose.connection.collection('users').findOne({
    role: { $in: ['admin', 'superadmin'] },
  });
  if (adminUser) {
    authorId = adminUser._id as any;
    console.log(`Found admin user: ${adminUser.email} (${adminUser._id})`);
  }

  let upsertedCount = 0;

  for (let i = 0; i < HTML_COMPLETE_CHAPTERS.length; i++) {
    const ch = HTML_COMPLETE_CHAPTERS[i];
    await Tutorial.findOneAndUpdate(
      { slug: ch.slug },
      {
        title: ch.title,
        slug: ch.slug,
        track: ch.track,
        sectionTitle: ch.sectionTitle,
        category: ch.category,
        level: ch.level,
        readingTime: ch.readingTime,
        excerpt: ch.excerpt,
        quickFacts: ch.quickFacts,
        keyPoints: ch.keyPoints,
        diagramImageUrl: ch.diagramImageUrl,
        codeSnippet: ch.codeSnippet,
        quiz: ch.quiz,
        content: ch.content,
        author: authorId,
        order: i + 1,
        isPublished: true,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 200) + 50,
      },
      { upsert: true, new: true }
    );
    console.log(`  [${i + 1}/${HTML_COMPLETE_CHAPTERS.length}] Upserted: ${ch.title} (${ch.slug})`);
    upsertedCount++;
  }

  // Update totalChapters on TutorialSubject
  await TutorialSubject.findOneAndUpdate(
    { slug: 'html' },
    {
      title: 'HTML',
      slug: 'html',
      shortTitle: 'HTML',
      category: 'Web Development',
      iconName: 'FileCode',
      description: 'Master HTML5 semantic document structure, accessibility (a11y), forms, canvas, and web performance.',
      totalChapters: upsertedCount,
      isPublished: true,
    },
    { upsert: true }
  );

  console.log(`\nSuccessfully seeded ${upsertedCount} HTML chapters and updated TutorialSubject!`);
  await mongoose.disconnect();
}

seedCompleteHtml().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
