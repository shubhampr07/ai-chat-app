'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Pre-process content: Remove single backticks ONLY (not double/triple backticks)
  // This regex uses negative lookahead/lookbehind to avoid matching `` or ```
  const processedContent = content.replace(/(?<!`)(?<!``)`(?!`)(?!``)/g, '');

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs
        p: ({ children }: any) => {
          // Check if children contains a code block or other block elements
          const hasBlockElement = Array.isArray(children)
            ? children.some((child: any) => child?.props?.className?.includes('border border-[#e8e5e0]'))
            : false;

          if (hasBlockElement) {
            return <div className="text-[15px] leading-7 text-[#2b2622] mb-4 last:mb-0">{children}</div>;
          }

          return (
            <p className="text-[15px] leading-7 text-[#2b2622] mb-4 last:mb-0">
              {children}
            </p>
          );
        },

        // Headings
        h1: ({ children }: any) => (
          <h1 className="text-2xl font-semibold text-[#2b2622] mb-4 mt-6 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }: any) => (
          <h2 className="text-xl font-semibold text-[#2b2622] mb-3 mt-5 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }: any) => (
          <h3 className="text-lg font-semibold text-[#2b2622] mb-3 mt-4 first:mt-0">
            {children}
          </h3>
        ),

        // Lists
        ul: ({ children }: any) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-[15px] text-[#2b2622]">
            {children}
          </ul>
        ),
        ol: ({ children }: any) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-[15px] text-[#2b2622]">
            {children}
          </ol>
        ),
        li: ({ children }: any) => (
          <li className="leading-7">{children}</li>
        ),

        // Code blocks only (no inline code rendering)
        code: ({ inline, className, children }: any) => {
          // Convert children to string safely
          const childArray = Array.isArray(children) ? children : [children];
          const codeString = childArray
            .map((child: any) => (typeof child === 'string' ? child : ''))
            .join('');

          // If it's inline code (single backticks), return null to skip rendering
          // This makes the backticks and content appear as plain text
          if (inline) {
            return null;
          }

          // Block code (triple backticks)
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : '';

          return (
            <CodeBlock language={language} code={codeString} />
          );
        },

        // Pre (code blocks container)
        pre: ({ children }: any) => <>{children}</>,

        // Blockquotes
        blockquote: ({ children }: any) => (
          <blockquote className="border-l-4 border-[#cc785c] pl-4 italic text-[#6b6560] my-4">
            {children}
          </blockquote>
        ),

        // Links
        a: ({ href, children }: any) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#cc785c] hover:underline"
          >
            {children}
          </a>
        ),

        // Bold
        strong: ({ children }: any) => (
          <strong className="font-semibold text-[#2b2622]">{children}</strong>
        ),

        // Italic
        em: ({ children }: any) => (
          <em className="italic">{children}</em>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="border-t border-[#e8e5e0] my-6" />
        ),

        // Tables
        table: ({ children }: any) => (
          <table className="min-w-full border-collapse border border-[#e8e5e0] my-4">
            {children}
          </table>
        ),
        thead: ({ children }: any) => (
          <thead className="bg-[#f5f3ef]">{children}</thead>
        ),
        tbody: ({ children }: any) => (
          <tbody>{children}</tbody>
        ),
        tr: ({ children }: any) => (
          <tr className="border-b border-[#e8e5e0]">{children}</tr>
        ),
        th: ({ children }: any) => (
          <th className="px-4 py-2 text-left text-sm font-semibold text-[#2b2622]">
            {children}
          </th>
        ),
        td: ({ children }: any) => (
          <td className="px-4 py-2 text-sm text-[#2b2622]">{children}</td>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`border border-[#e8e5e0] rounded-xl overflow-hidden my-4 transition-all bg-[#1e1e1e] ${
        isExpanded ? 'fixed inset-8 z-50 shadow-2xl' : ''
      }`}
    >
      <div className="bg-[#2d2d2d] px-4 py-2.5 flex items-center justify-between border-b border-[#3d3d3d]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-300">
            {language || 'code'}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-[#3d3d3d] rounded-md transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-[#3d3d3d] rounded-md transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5 text-gray-300" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
      <div
        className={`overflow-auto ${
          isExpanded ? 'h-[calc(100%-48px)]' : 'max-h-[400px]'
        }`}
      >
        <pre className="p-4 text-sm font-mono leading-6 !bg-[#1e1e1e] !m-0">
          <code className="text-gray-100">{code}</code>
        </pre>
      </div>
    </div>
  );
}
