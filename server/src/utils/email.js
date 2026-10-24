import nodemailer from 'nodemailer'
import 'dotenv/config'

export const enviarEmail = async (para, assunto, html, codigoDebug = null) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, NODE_ENV } = process.env

  if (!SMTP_USER || !SMTP_PASS) {
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
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 465,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })

    await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: para,
      subject: assunto,
      html
    })
    return { enviado: true }
  } catch (err) {
    console.error('Erro ao enviar email:', err.message)
    if (NODE_ENV !== 'production') {
      console.log('\n=== EMAIL (ERRO SMTP - MODO DEV) ===')
      if (codigoDebug) console.log('CÓDIGO:', codigoDebug)
      console.log('Para:', para)
      console.log('=====================================\n')
    }
    return { enviado: false, erro: err.message }
  }
}
