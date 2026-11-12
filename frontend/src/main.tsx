import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n';
import './new.css';
import Site from './Site';
createRoot(document.getElementById('root')!).render(<StrictMode><LanguageProvider><Site /></LanguageProvider></StrictMode>);
