import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import pt from './pt.json'
import en from './en.json'

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: { pt, en },
  fallbackLng: 'pt',
  supportedLngs: ['pt', 'en'],
  ns: ['common', 'nav', 'auth', 'home', 'dashboard', 'scholarships', 'mentoring', 'account', 'admin', 'errors', 'status'],
  defaultNS: 'common',
  detection: { order: ['localStorage'], lookupLocalStorage: 'lang', caches: ['localStorage'] },
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language?.startsWith('en') ? 'en' : 'pt'
i18n.on('languageChanged', language => { document.documentElement.lang = language.startsWith('en') ? 'en' : 'pt' })

export const localeFor = language => language?.startsWith('en') ? 'en-GB' : 'pt-PT'
export default i18n
