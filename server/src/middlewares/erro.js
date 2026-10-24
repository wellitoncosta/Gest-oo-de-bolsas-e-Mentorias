export const erroHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    const primeira = err.errors?.[0]?.message || 'Dados inválidos'
    return res.status(400).json({ mensagem: primeira, erros: err.errors })
  }
  if (err.status) {
    return res.status(err.status).json({ mensagem: err.message || 'Erro', codigo: err.codigo })
  }
  console.error(err)
  res.status(500).json({ mensagem: 'Erro interno do servidor' })
}
