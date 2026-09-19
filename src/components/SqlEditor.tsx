import React, { useRef, useEffect } from 'react';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
}

// Simple syntax highlighter for SQL
function highlightSQL(sql: string): string {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'HAVING', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'EXISTS', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'OFFSET', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'UNION', 'ALL', 'TOP', 'LIMIT', 'WITH', 'DECLARE', 'BEGIN', 'COMMIT', 'ROLLBACK'];
  
  let result = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight strings
  result = result.replace(/'([^']*)'/g, '<span style="color:#a5d6ff">\'$1\'</span>');
  
  // Highlight parameters (@paramName)
  result = result.replace(/@(\w+)/g, '<span style="color:#ffa657">@$1</span>');
  
  // Highlight numbers
  result = result.replace(/\b(\d+)\b/g, '<span style="color:#79c0ff">$1</span>');
  
  // Highlight keywords
  const keywordPattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  result = result.replace(keywordPattern, (match) => {
    return `<span style="color:#ff7b72;font-weight:600">${match.toUpperCase()}</span>`;
  });

  // Highlight comments
  result = result.replace(/--(.*)$/gm, '<span style="color:#8b949e;font-style:italic">--$1</span>');

  return result;
}

export const SqlEditorComponent: React.FC<SqlEditorProps> = ({ value, onChange, readOnly = false, height = '300px' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  useEffect(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.innerHTML = highlightSQL(value) + '\n';
    }
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117]" style={{ height }}>
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 bottom-0 w-12 bg-[#0d1117] border-r border-gray-800 overflow-hidden select-none z-10"
      >
        <div className="py-3 px-2">
          {lines.map((_, i) => (
            <div key={i} className="text-right text-xs leading-[1.5] text-gray-600 font-mono" style={{ height: '1.5em' }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Syntax highlighted layer */}
      <pre
        ref={highlightRef}
        className="absolute inset-0 pl-14 pr-4 py-3 text-sm leading-[1.5] font-mono text-gray-300 whitespace-pre overflow-hidden pointer-events-none"
        style={{ tabSize: 4 }}
        aria-hidden="true"
      />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        className="absolute inset-0 w-full h-full pl-14 pr-4 py-3 text-sm leading-[1.5] font-mono bg-transparent text-transparent caret-white resize-none outline-none z-20"
        style={{ tabSize: 4, caretColor: '#ffffff' }}
      />
    </div>
  );
};
