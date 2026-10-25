import nodemailer from 'nodemailer'
import 'dotenv/config'

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, NODE_ENV } = process.env

let transporter = null

const criarTransporter = () => {
  if (transporter) return transporter
  if (!SMTP_USER || !SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: Number(SMTP_PORT) === 465,
    pool: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export const enviarEmail = async (para, assunto, html, codigoDebug = null) => {
  const t = criarTransporter()

  if (!t) {
    if (NODE_ENV !== 'production') {
      console.log('\n=== EMAIL (DEV - SMTP não configurado) ===')
      if (codigoDebug) console.log('CÓDIGO:', codigoDebug)
      console.log('Para:', para)
      console.log('Assunto:', assunto)
      console.log('=========================================\n')
    }
    return { enviado: false, dev: true }
  }

  try {
    await t.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: para,
      subject: assunto,
      html,
    })
    return { enviado: true }
  } catch (err) {
    console.error('Erro ao enviar email:', err.message)
    if (NODE_ENV !== 'production') {
      console.log('\n=== EMAIL (ERRO SMTP - MODO DEV) ===')
      if (codigoDebug) console.log('CÓDIGO:', codigoDebug)
      console.log('Para:', para)
      console.log('=====================================\n')
      return { enviado: false, dev: true, erro: err.message }
    }
    throw err
  }
}
