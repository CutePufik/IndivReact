const ENDPOINT = 'https://godbolt.org/api/compiler/java2102/compile'

const TYPE_DECLARATION =
  /^([ \t]*)public[ \t]+((?:(?:abstract|final|sealed|non-sealed|strictfp)[ \t]+)*)(class|interface|enum|record)\b/gm

export function prepareJavaSource(source) {
  return source.replace(/\r\n/g, '\n').replace(TYPE_DECLARATION, '$1$2$3')
}

async function postCompiler(body, signal) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Сервис компиляции ответил кодом ${response.status}`)
  }

  return response.json()
}

export async function compileToBytecode(source, signal) {
  const data = await postCompiler({
    source: prepareJavaSource(source),
    options: {
      userArguments: '',
      filters: {
        commentOnly: true,
        directives: true,
        labels: true,
        trim: false,
      },
    },
  }, signal)
  const bytecode = (data.asm ?? []).map((line) => line.text ?? '').join('\n').trim()
  const diagnostics = (data.stderr ?? []).map((line) => line.text ?? '').join('\n').trim()

  if (data.code !== 0 || bytecode === '<Compilation failed>') {
    const error = new Error('Компиляция не удалась')
    error.details = diagnostics || bytecode || 'javac не вернул текст ошибки'
    throw error
  }

  return {
    bytecode,
    warnings: diagnostics,
    execTime: data.execTime ?? null,
  }
}

export async function runJavaProgram(source, signal) {
  const data = await postCompiler({
    source: prepareJavaSource(source),
    options: {
      compilerOptions: { executorRequest: true },
      executeParameters: {
        args: [],
        stdin: '',
        runtimeTools: [
          { name: 'env', options: [{ name: 'LANG', value: 'C.UTF-8' }] },
        ],
      },
      filters: { execute: true },
    },
  }, signal)

  return {
    stdout: (data.stdout ?? []).map((line) => line.text ?? '').join('\n'),
    stderr: (data.stderr ?? []).map((line) => line.text ?? '').join('\n').trim(),
    exitCode: data.code ?? null,
    didExecute: Boolean(data.didExecute),
    timedOut: Boolean(data.timedOut),
  }
}
