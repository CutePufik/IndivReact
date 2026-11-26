import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { compileToBytecode, runJavaProgram } from './api/bytecode'
import { editOnEnter, editOnTab, editOnUntab } from './editor'

const SAMPLE = `public class Main {
    public static int sum(int left, int right) {
        int total = left + right;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sum(20, 22));
    }
}
`

const EMPTY_RUN = {
  stdout: '',
  stderr: '',
  exitCode: null,
  timedOut: false,
  note: '',
}

const PAUSE_MS = 3000

export default function App() {
  const [code, setCode] = useState(SAMPLE)
  const [output, setOutput] = useState('')
  const [outputFailed, setOutputFailed] = useState(false)
  const [run, setRun] = useState(null)
  const [phase, setPhase] = useState('waiting')
  const [waitLeft, setWaitLeft] = useState(3)
  const [detail, setDetail] = useState('Пауза перед запросом')
  const [compileToken, setCompileToken] = useState(0)
  const editorRef = useRef(null)
  const caretRef = useRef(null)
  const immediateRef = useRef(false)

  useLayoutEffect(() => {
    const caret = caretRef.current
    const editor = editorRef.current
    if (!caret || !editor) return
    editor.focus()
    editor.selectionStart = caret.start
    editor.selectionEnd = caret.end
    caretRef.current = null
  }, [code])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Enter' || event.shiftKey || event.altKey) return
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      immediateRef.current = true
      setCompileToken((value) => value + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const immediate = immediateRef.current
    immediateRef.current = false

    if (!code.trim()) {
      setPhase('empty')
      setOutput('')
      setOutputFailed(false)
      setRun(null)
      setDetail('Окно пустое')
      return
    }

    const controller = new AbortController()
    let tick
    let handle

    async function run() {
      clearInterval(tick)
      setPhase('loading')
      setDetail('Компиляция и запуск')
      const [compiled, executed] = await Promise.allSettled([
        compileToBytecode(code, controller.signal),
        runJavaProgram(code, controller.signal),
      ])
      if (controller.signal.aborted) return

      if (compiled.status === 'rejected') {
        const error = compiled.reason
        if (error?.name === 'AbortError') return
        setOutput(error.details || error.message)
        setOutputFailed(true)
        setRun({ ...EMPTY_RUN, note: 'Код не скомпилировался, программа не запускалась.' })
        setPhase('error')
        setDetail(error.message || 'Запрос не удался')
        return
      }

      const seconds = compiled.value.execTime == null ? '' : ` · javac ${compiled.value.execTime} мс`
      setOutput(compiled.value.bytecode)
      setOutputFailed(false)
      setPhase('ready')
      setDetail(
        compiled.value.warnings
          ? `Есть предупреждения javac${seconds}`
          : `Байткод и вывод обновлены${seconds}`,
      )

      if (executed.status === 'rejected') {
        const error = executed.reason
        if (error?.name === 'AbortError') return
        setRun({ ...EMPTY_RUN, note: error.message || 'Запуск не удался' })
        return
      }

      setRun({
        stdout: executed.value.stdout,
        stderr: executed.value.stderr,
        exitCode: executed.value.exitCode,
        timedOut: executed.value.timedOut,
        note: '',
      })
    }

    if (immediate) {
      run()
    } else {
      const started = Date.now()
      setPhase('waiting')
      setWaitLeft(3)
      setDetail('Пауза перед запросом')
      tick = setInterval(() => {
        const left = Math.max(0, Math.ceil((PAUSE_MS - (Date.now() - started)) / 1000))
        setWaitLeft(left)
      }, 200)
      handle = setTimeout(run, PAUSE_MS)
    }

    return () => {
      controller.abort()
      clearTimeout(handle)
      clearInterval(tick)
    }
  }, [code, compileToken])

  function requestCompileNow() {
    immediateRef.current = true
    setCompileToken((value) => value + 1)
  }

  function applyEdit(edit) {
    caretRef.current = { start: edit.start, end: edit.end }
    setCode(edit.value)
  }

  function onEditorKeyDown(event) {
    const editor = event.currentTarget
    const { selectionStart, selectionEnd } = editor
    if (event.key === 'Tab') {
      event.preventDefault()
      const edit = event.shiftKey
        ? editOnUntab(code, selectionStart, selectionEnd)
        : editOnTab(code, selectionStart, selectionEnd)
      applyEdit(edit)
      return
    }
    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      applyEdit(editOnEnter(code, selectionStart, selectionEnd))
    }
  }

  const status = phase === 'waiting' ? `запрос через ${waitLeft} с` : detail

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">OpenJDK 21 · javap</p>
          <h1>Java и байткод</h1>
        </div>
        <p className="lede">
          Слева код, справа байткод и то, что программа напечатала в <code>main</code>. После паузы
          в 3 секунды запрос уходит сам. Кнопка или Ctrl+Enter запускают его сразу. Компиляция идёт через Compiler Explorer:
          {' '}
          <code>POST /api/compiler/java2102/compile</code>.
        </p>
      </header>

      <main className="workspace">
        <section className="pane" aria-labelledby="source-title">
          <div className="pane-head">
            <h2 id="source-title">Исходный код</h2>
            <div className="pane-tools">
              <button
                type="button"
                className="compile"
                onClick={requestCompileNow}
                disabled={!code.trim() || phase === 'loading'}
              >
                Запустить
                <kbd>Ctrl+Enter</kbd>
              </button>
              <p className={`status status-${phase}`}>{status}</p>
            </div>
          </div>
          <textarea
            ref={editorRef}
            value={code}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Исходный код Java"
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={onEditorKeyDown}
          />
        </section>

        <div className="results">
          <section className="pane" aria-labelledby="bytecode-title">
            <div className="pane-head">
              <h2 id="bytecode-title">Байткод</h2>
              <p className="status-quiet">{phase === 'loading' ? 'компиляция…' : 'javap -c -p'}</p>
            </div>
            <BytecodeView text={output} failed={outputFailed} pending={phase === 'empty'} />
          </section>

          <section className="pane run-pane" aria-labelledby="run-title">
            <div className="pane-head">
              <h2 id="run-title">Вывод</h2>
              <p className="status-quiet">{runCaption(run, phase)}</p>
            </div>
            <RunView run={run} pending={phase === 'empty' || run == null} />
          </section>
        </div>
      </main>

      <p className="hint">
        Сервис сохраняет текст в файл <code>example.java</code>. Если тип объявлен как{' '}
        <code>public</code>, этот модификатор снимается только в запросе: иначе <code>javac</code>{' '}
        потребует совпадения имени файла и имени класса. В редакторе текст не меняется. Чтобы в
        нижнем окне был текст, нужен <code>main</code>. Пакет в первой строке лучше не указывать.
      </p>
    </div>
  )
}

function runCaption(run, phase) {
  if (phase === 'loading') return 'запуск…'
  if (!run || run.note) return 'stdout'
  if (run.timedOut) return 'таймаут'
  if (run.exitCode != null && run.exitCode !== 0) return `код выхода ${run.exitCode}`
  return 'stdout'
}

function RunView({ run, pending }) {
  if (pending) {
    return <pre className="output muted">Здесь появится вывод программы.</pre>
  }
  if (run.note) {
    return <pre className="output muted">{run.note}</pre>
  }
  if (run.timedOut && !run.stdout && !run.stderr) {
    return <pre className="output failed">Программа прервана по таймауту.</pre>
  }
  if (!run.stdout && !run.stderr) {
    return <pre className="output muted">Программа ничего не напечатала.</pre>
  }

  return (
    <pre className="output run">
      {run.stdout ? <span className="run-out">{run.stdout}</span> : null}
      {run.stderr ? <span className="run-error">{run.stderr}</span> : null}
    </pre>
  )
}

function BytecodeView({ text, failed, pending }) {
  if (pending || !text) {
    return <pre className="output muted">Здесь появится байткод.</pre>
  }
  if (failed) {
    return <pre className="output failed">{text}</pre>
  }

  return (
    <pre className="output">
      {text.split('\n').map((line, index) => (
        <BytecodeLine key={index} line={line} />
      ))}
    </pre>
  )
}

function BytecodeLine({ line }) {
  const match = line.match(/^(\s*\d+:\s*)([A-Za-z_][\w]*)(.*)$/)
  if (!match) {
    return <span className="line">{line || ' '}</span>
  }
  return (
    <span className="line">
      {match[1]}
      <span className="op">{match[2]}</span>
      {match[3]}
    </span>
  )
}
