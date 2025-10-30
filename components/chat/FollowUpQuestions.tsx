'use client';

import { MessageCircle } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isLoading?: boolean;
}

export function FollowUpQuestions({ questions, onQuestionClick, isLoading }: FollowUpQuestionsProps) {
  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#6b6560] mb-3">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium">Related questions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="px-4 py-2.5 bg-white/50 rounded-lg border border-[#ddd9d3] animate-pulse h-10 w-48"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm text-[#6b6560] mb-3">
        <MessageCircle className="h-4 w-4" />
        <span className="font-medium">Related questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="group px-4 py-2.5 text-left text-sm text-[#2b2622] bg-white hover:bg-[#f5f3ef] rounded-lg transition-all border border-[#ddd9d3] hover:border-[#cc785c] hover:shadow-sm"
          >
            <span className="block">{question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
