import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'en' | 'nl';
type LanguageContext = { language:Language; setLanguage:(language:Language)=>void; t:(dutch:string,english:string)=>string };
const Context=createContext<LanguageContext|null>(null);
const STORAGE_KEY='gridqueue-language';
export function LanguageProvider({children}:{children:ReactNode}){
  const [language,setLanguage]=useState<Language>(()=>{
    try { const saved=localStorage.getItem(STORAGE_KEY); return saved==='nl'||saved==='en'?saved:'en'; }
    catch { return 'en'; }
  });
  useEffect(()=>{
    document.documentElement.lang=language;
    document.title=language==='nl'?'GridQueue — De aansluiting, in de woorden van de netbeheerder':'GridQueue — The connection, in the grid operator’s own words';
    const description=document.querySelector('meta[name="description"]');
    description?.setAttribute('content',language==='nl'?'GridQueue — een controleerbaar antwoord op uw netvraag.':'GridQueue — a verifiable answer to your grid connection question.');
    try { localStorage.setItem(STORAGE_KEY,language); } catch { /* Still usable without storage. */ }
  },[language]);
  return <Context.Provider value={{language,setLanguage,t:(nl,en)=>language==='nl'?nl:en}}>{children}</Context.Provider>;
}
export function useLanguage(){const value=useContext(Context);if(!value)throw new Error('LanguageProvider missing');return value;}
