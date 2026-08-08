import React from 'react'
import * as diff from 'diff'

export default function DiffViewer({ oldText = '', newText = '' }) {
  // Strip HTML tags for clean diffing if needed, but here we can just diff the raw text or basic HTML
  // Since it's rich text, a simple diffWords works well enough for visual comparison
  const diffResult = diff.diffWordsWithSpace(oldText, newText)

  const hasChanges = diffResult.some(part => part.added || part.removed)

  if (!hasChanges) {
    return (
      <div className="font-sans leading-relaxed text-gray-500 dark:text-slate-400 italic">
        এই অংশে কোনো পরিবর্তন করা হয়নি। (No changes made)
      </div>
    )
  }

  return (
    <div className="font-sans leading-relaxed text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
      {diffResult.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-1 rounded mx-0.5 border-b-2 border-green-400">
              {part.value}
            </span>
          )
        }
        if (part.removed) {
          return (
            <span key={index} className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-1 rounded mx-0.5 line-through decoration-red-400 decoration-2">
              {part.value}
            </span>
          )
        }
        return <span key={index}>{part.value}</span>
      })}
    </div>
  )
}
