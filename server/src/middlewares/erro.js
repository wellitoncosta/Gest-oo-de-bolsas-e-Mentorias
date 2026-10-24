export const erroHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ mensagem: 'Dados inválidos', erros: err.errors })
  }
  if (err.status) {
    return res.status(err.status).json({ mensagem: err.message || 'Erro', codigo: err.codigo })
  }
  console.error(err)
  res.status(500).json({ mensagem: 'Erro interno do servidor' })
}
