const INDENT = '    '

export function editOnTab(value, start, end) {
  if (start === end && isInLeadingWhitespace(value, start)) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const column = start - lineStart
    const pad = INDENT.length - (column % INDENT.length)
    return insertText(value, start, end, ' '.repeat(pad))
  }
  if (start !== end) {
    return changeLineIndent(value, start, end, 1)
  }
  return insertText(value, start, end, INDENT)
}

export function editOnUntab(value, start, end) {
  return changeLineIndent(value, start, end, -1)
}

export function editOnEnter(value, start, end) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const indent = (value.slice(lineStart).match(/^[ \t]*/) ?? [''])[0]
  return insertText(value, start, end, `\n${indent}`)
}

function insertText(value, start, end, text) {
  return {
    value: value.slice(0, start) + text + value.slice(end),
    start: start + text.length,
    end: start + text.length,
  }
}

function isInLeadingWhitespace(value, index) {
  const lineStart = value.lastIndexOf('\n', index - 1) + 1
  return /^[ \t]*$/.test(value.slice(lineStart, index))
}

function changeLineIndent(value, selectionStart, selectionEnd, direction) {
  const from = value.lastIndexOf('\n', selectionStart - 1) + 1
  let last = selectionEnd
  if (last > selectionStart && value[last - 1] === '\n') last -= 1
  let to = value.indexOf('\n', last)
  if (to === -1) to = value.length

  const lines = value.slice(from, to).split('\n')
  const nextLines = lines.map((line) => adjustIndent(line, direction))
  const nextBlock = nextLines.join('\n')
  const nextValue = value.slice(0, from) + nextBlock + value.slice(to)

  const mapPos = (pos) => {
    if (pos <= from) return pos
    if (pos >= to) return pos + nextBlock.length - (to - from)
    let offset = from
    let nextOffset = from
    for (let index = 0; index < lines.length; index += 1) {
      const lineEnd = offset + lines[index].length
      const removed = direction < 0 ? leadingChunk(lines[index]) : 0
      const added = direction > 0 ? INDENT.length : 0
      if (pos <= lineEnd) {
        const within = pos - offset
        if (direction > 0) return nextOffset + within + added
        return nextOffset + Math.max(0, within - removed)
      }
      offset = lineEnd + 1
      nextOffset += nextLines[index].length + 1
    }
    return from + nextBlock.length
  }

  return {
    value: nextValue,
    start: mapPos(selectionStart),
    end: mapPos(selectionEnd),
  }
}

function adjustIndent(line, direction) {
  if (direction > 0) return INDENT + line
  return line.slice(leadingChunk(line))
}

function leadingChunk(line) {
  if (line.startsWith('\t')) return 1
  const spaces = line.match(/^ */)?.[0].length ?? 0
  return Math.min(INDENT.length, spaces)
}
