import { createI18n } from 'vue-i18n';
import CN from './cn';
import EN from './en';

const message = {
  cn: {
    ...CN,
  },
  en: {
    ...EN,
  },
};

const i18n = createI18n({
  locale: 'cn',
  legacy: false,
  globalInjection: true,
  messages: message,
});

export default i18n;
