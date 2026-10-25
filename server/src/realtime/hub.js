const clientes = new Set()
let temporizadorEstatisticas

function enviar(cliente, evento, dados) {
  if (cliente.res.writableEnded || cliente.res.destroyed) {
    remover(cliente)
    return
  }
  try {
    cliente.res.write(`event: ${evento}\ndata: ${JSON.stringify(dados ?? {})}\n\n`)
  } catch {
    remover(cliente)
  }
}

function remover(cliente) {
  clearInterval(cliente.heartbeat)
  clientes.delete(cliente)
}

export function registarCliente({ userId, role, res }) {
  const cliente = { userId, role, res }
  clientes.add(cliente)
  cliente.heartbeat = setInterval(() => {
    if (res.writableEnded || res.destroyed) return remover(cliente)
    try {
      res.write(': ping\n\n')
    } catch {
      remover(cliente)
    }
  }, 25_000)
  cliente.heartbeat.unref?.()
  res.on('close', () => remover(cliente))
  return () => remover(cliente)
}

export function emitirTodos(evento, dados) {
  for (const cliente of clientes) enviar(cliente, evento, dados)
}

export function emitirPara(userId, evento, dados) {
  if (!userId) return
  for (const cliente of clientes) {
    if (cliente.userId === userId) enviar(cliente, evento, dados)
  }
}

export function emitirParaRole(role, evento, dados) {
  for (const cliente of clientes) {
    if (cliente.role === role) enviar(cliente, evento, dados)
  }
}

export function emitirEstatisticasAlteradas() {
  clearTimeout(temporizadorEstatisticas)
  temporizadorEstatisticas = setTimeout(() => emitirTodos('estatisticas:alteradas', {}), 2_000)
  temporizadorEstatisticas.unref?.()
}
