'use client';

import { useState } from 'react';
import { Artifact } from '@/types/chat';
import { Copy, Maximize2, Minimize2, Check } from 'lucide-react';

interface ArtifactBlockProps {
  artifact: Artifact;
}

export function ArtifactBlock({ artifact }: ArtifactBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (artifact.type === 'code') {
    return (
      <div className={`border border-gray-200 rounded-xl overflow-hidden transition-all bg-gray-50 ${
        isExpanded ? 'fixed inset-8 z-50 shadow-2xl' : ''
      }`}>
        <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700">
              {artifact.language || 'code'}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
              title="Copy code"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? (
                <Minimize2 className="h-3.5 w-3.5 text-gray-600" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        <div className={`bg-[#fafafa] overflow-auto ${
          isExpanded ? 'h-[calc(100%-48px)]' : 'max-h-[400px]'
        }`}>
          <pre className="p-4 text-sm font-mono leading-6">
            <code className="text-gray-900">{artifact.content}</code>
          </pre>
        </div>
      </div>
    );
  }

  if (artifact.type === 'markdown') {
    return (
      <div className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${
        isExpanded ? 'fixed inset-8 z-50 bg-white shadow-2xl' : ''
      }`}>
        <div className="bg-gray-100 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
          <span className="text-xs font-medium text-gray-700">markdown</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5 text-gray-600" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
            )}
          </button>
        </div>
        <div className={`bg-white p-4 overflow-auto prose prose-sm max-w-none ${
          isExpanded ? 'h-[calc(100%-48px)]' : 'max-h-[400px]'
        }`}>
          <div className="whitespace-pre-wrap text-gray-900">{artifact.content}</div>
        </div>
      </div>
    );
  }

  return null;
}
