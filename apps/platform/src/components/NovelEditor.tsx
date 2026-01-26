import { useCallback, useMemo } from "react";
import {
  EditorRoot,
  EditorContent,
  type JSONContent,
  StarterKit,
  TiptapLink,
  TiptapImage,
  TiptapUnderline,
  Placeholder,
} from "novel";

interface NovelEditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  className?: string;
}

const extensions = [
  StarterKit,
  TiptapLink.configure({
    HTMLAttributes: { class: "text-primary underline" },
  }),
  TiptapImage,
  TiptapUnderline,
  Placeholder.configure({
    placeholder: "Start writing your lesson content...",
  }),
];

export function NovelEditor({ initialContent, onChange, className }: NovelEditorProps) {
  const initialJSON = useMemo(() => {
    if (!initialContent) return undefined;
    // Convert markdown to HTML if content looks like markdown
    const content = looksLikeMarkdown(initialContent) 
      ? markdownToHtml(initialContent) 
      : initialContent;
    return htmlToJSON(content);
  }, [initialContent]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: { getHTML: () => string } }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    [onChange]
  );

  return (
    <div className={className}>
      <EditorRoot>
        <EditorContent
          immediatelyRender={false}
          initialContent={initialJSON}
          extensions={extensions}
          className="relative min-h-[300px] w-full border border-border rounded-lg bg-background overflow-hidden"
          editorProps={{
            attributes: {
              class:
                "prose prose-sm dark:prose-invert focus:outline-none max-w-full p-4 min-h-[300px]",
            },
          }}
          onUpdate={handleUpdate}
        />
      </EditorRoot>
    </div>
  );
}

function htmlToJSON(html: string): JSONContent | undefined {
  if (!html || html.trim() === "") {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  const content: JSONContent[] = [];

  function parseNode(node: Node): JSONContent | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (!text) return null;
      return { type: "text", text };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    const children: JSONContent[] = [];
    element.childNodes.forEach((child) => {
      const parsed = parseNode(child);
      if (parsed) children.push(parsed);
    });

    switch (tagName) {
      case "p":
        return { type: "paragraph", content: children.length > 0 ? children : undefined };
      case "h1":
        return { type: "heading", attrs: { level: 1 }, content: children };
      case "h2":
        return { type: "heading", attrs: { level: 2 }, content: children };
      case "h3":
        return { type: "heading", attrs: { level: 3 }, content: children };
      case "ul":
        return { type: "bulletList", content: children };
      case "ol":
        return { type: "orderedList", content: children };
      case "li":
        return { type: "listItem", content: children.length > 0 ? children : [{ type: "paragraph" }] };
      case "blockquote":
        return { type: "blockquote", content: children };
      case "code":
        if (element.parentElement?.tagName.toLowerCase() === "pre") {
          return { type: "text", text: element.textContent || "" };
        }
        return { type: "text", marks: [{ type: "code" }], text: element.textContent || "" };
      case "pre":
        return {
          type: "codeBlock",
          attrs: { language: null },
          content: children,
        };
      case "strong":
      case "b":
        return children.length === 1 && children[0].type === "text"
          ? { ...children[0], marks: [...(children[0].marks || []), { type: "bold" }] }
          : { type: "text", marks: [{ type: "bold" }], text: element.textContent || "" };
      case "em":
      case "i":
        return children.length === 1 && children[0].type === "text"
          ? { ...children[0], marks: [...(children[0].marks || []), { type: "italic" }] }
          : { type: "text", marks: [{ type: "italic" }], text: element.textContent || "" };
      case "a":
        return {
          type: "text",
          marks: [{ type: "link", attrs: { href: element.getAttribute("href") || "" } }],
          text: element.textContent || "",
        };
      case "br":
        return { type: "hardBreak" };
      case "hr":
        return { type: "horizontalRule" };
      default:
        if (children.length > 0) {
          return children.length === 1 ? children[0] : { type: "paragraph", content: children };
        }
        if (element.textContent) {
          return { type: "text", text: element.textContent };
        }
        return null;
    }
  }

  body.childNodes.forEach((node) => {
    const parsed = parseNode(node);
    if (parsed) {
      if (parsed.type === "text") {
        content.push({ type: "paragraph", content: [parsed] });
      } else {
        content.push(parsed);
      }
    }
  });

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

function looksLikeMarkdown(text: string): boolean {
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headers
    /^\s*[-*+]\s/m,         // Unordered lists
    /^\s*\d+\.\s/m,         // Ordered lists
    /```/,                   // Code blocks
    /\*\*[^*]+\*\*/,        // Bold
    /\*[^*]+\*/,            // Italic
    /\[.+\]\(.+\)/,         // Links
    /^>/m,                   // Blockquotes
  ];
  return markdownPatterns.some(pattern => pattern.test(text));
}

function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Code blocks (must be first to prevent inner parsing)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[\s]*[-*+] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists  
  html = html.replace(/^[\s]*\d+\. (.+)$/gm, '<li>$1</li>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs (lines not already wrapped)
  html = html.split('\n\n').map(block => {
    if (block.trim() && !block.match(/^<[a-z]/i)) {
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }
    return block;
  }).join('\n');

  return html;
}
