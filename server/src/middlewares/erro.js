export const erroHandler = (err, req, res, next) => {
  console.error(err)
  if (err.name === 'ZodError') {
    return res.status(400).json({ mensagem: 'Dados inválidos', erros: err.errors })
  }
  res.status(err.status || 500).json({ mensagem: err.message || 'Erro interno do servidor' })
}
