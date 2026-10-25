import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import pt from './pt.json'
import en from './en.json'
import homeExtraPt from './home-extra-pt.json'
import homeExtraEn from './home-extra-en.json'
import feedbackPt from './feedback-pt.json'
import feedbackEn from './feedback-en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: {
        ...pt,
        areas: pt.areas,
        home: { ...pt.home, ...homeExtraPt },
        errors: pt.errors,
        mentoring: { ...pt.mentoring, ...feedbackPt.mentoring },
        scholarships: { ...pt.scholarships, ...feedbackPt.scholarships },
        admin: { ...pt.admin, ...feedbackPt.admin },
        common: { ...pt.common, confirmTitle: 'Confirmar ação', continue: 'Continuar' },
      },
      en: {
        ...en,
        areas: en.areas,
        home: { ...en.home, ...homeExtraEn },
        errors: en.errors,
        mentoring: { ...en.mentoring, ...feedbackEn.mentoring },
        scholarships: { ...en.scholarships, ...feedbackEn.scholarships },
        admin: { ...en.admin, ...feedbackEn.admin },
        common: { ...en.common, confirmTitle: 'Confirm action', continue: 'Continue' },
      },
    },
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en'],
    ns: [
      'common',
      'areas',
      'nav',
      'auth',
      'home',
      'dashboard',
      'scholarships',
      'mentoring',
      'account',
      'admin',
      'errors',
      'status',
    ],
    defaultNS: 'common',
    detection: { order: ['localStorage'], lookupLocalStorage: 'lang', caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  })

document.documentElement.lang = i18n.language?.startsWith('en') ? 'en' : 'pt'
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language.startsWith('en') ? 'en' : 'pt'
})

export const localeFor = (language) => (language?.startsWith('en') ? 'en-GB' : 'pt-PT')
export default i18n
