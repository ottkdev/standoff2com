'use client'

interface WikiArticleViewProps {
  content: string
}

/**
 * Renders wiki article content with proper formatting
 * Supports markdown-like syntax and custom wiki formatting
 */
export function WikiArticleView({ content }: WikiArticleViewProps) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let currentList: string[] = []
  let inList = false

  const processInline = (text: string): React.ReactNode => {
    // Bold
    let processed = text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    // Italic
    processed = processed.flatMap((part) => {
      if (typeof part === 'string') {
        return part.split(/(\*[^*]+\*)/g).map((p, i) => {
          if (p.startsWith('*') && p.endsWith('*') && !p.startsWith('**')) {
            return <em key={i}>{p.slice(1, -1)}</em>
          }
          return p
        })
      }
      return part
    })

    // Links - [text](url)
    const final: React.ReactNode[] = []
    processed.forEach((part, i) => {
      if (typeof part === 'string') {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        let lastIndex = 0
        let match

        while ((match = linkRegex.exec(part)) !== null) {
          if (match.index > lastIndex) {
            final.push(part.slice(lastIndex, match.index))
          }
          final.push(
            <a
              key={`link-${i}-${match.index}`}
              href={match[2]}
              className="text-primary hover:underline"
            >
              {match[1]}
            </a>
          )
          lastIndex = match.index + match[0].length
        }
        if (lastIndex < part.length) {
          final.push(part.slice(lastIndex))
        }
      } else {
        final.push(part)
      }
    })

    return <>{final}</>
  }

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc ml-4 md:ml-6 mb-4 space-y-2 break-words">
          {currentList.map((item, idx) => (
            <li key={idx} className="break-words">{processInline(item)}</li>
          ))}
        </ul>
      )
      currentList = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Headers
    if (trimmed.startsWith('## ')) {
      flushList()
      const text = trimmed.replace('## ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      elements.push(
        <h2
          key={`h2-${index}`}
          id={id}
          className="text-2xl font-bold mt-8 mb-4 scroll-mt-20"
        >
          {text}
        </h2>
      )
      return
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      const text = trimmed.replace('### ', '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      elements.push(
        <h3
          key={`h3-${index}`}
          id={id}
          className="text-xl font-semibold mt-6 mb-3 scroll-mt-20"
        >
          {text}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('#### ')) {
      flushList()
      const text = trimmed.replace('#### ', '').trim()
      elements.push(
        <h4 key={`h4-${index}`} className="text-lg font-semibold mt-4 mb-2">
          {text}
        </h4>
      )
      return
    }

    // Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      currentList.push(trimmed.slice(2).trim())
      return
    }

    // Empty lines
    if (trimmed === '') {
      flushList()
      return
    }

    // Regular paragraphs
    flushList()
    if (trimmed) {
      elements.push(
        <p key={`p-${index}`} className="mb-4 leading-relaxed">
          {processInline(trimmed)}
        </p>
      )
    }
  })

  flushList()

  return <div className="wiki-content">{elements}</div>
}

