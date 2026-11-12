import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, HelpCircle, FileSearch, Fingerprint, MapPin, MoveUpRight, PlugZap, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useLanguage } from './i18n';
import './intro.css';

type IntroPage='/'|'/intro/2'|'/demo';
type Props={slide:1|2;go:(page:IntroPage)=>void};

export default function IntroSlides({slide,go}:Props){
  const {t}=useLanguage();
  const [lens,setLens]=useState(0);
  const [step,setStep]=useState(0);
  const lenses=[
    {name:t('Locatie','Location'),icon:MapPin,title:t('Het begint met een plek.','It starts with a place.'),body:t('Een postcode alleen bevestigt niet welk netwerk of station uw aansluiting bedient. Dat moet eerst worden geverifieerd.','A postcode alone does not confirm which network or station serves your connection. That link must first be verified.')},
    {name:t('Richting','Direction'),icon:PlugZap,title:t('Stroom afnemen is niet hetzelfde als terugleveren.','Taking power is not the same as feeding it in.'),body:t('De beschikbare informatie kan verschillen voor afname en teruglevering. Een antwoord moet de juiste richting behandelen.','The available information can differ for consumption and feed-in. An answer must cover the right direction.')},
    {name:t('Bron','Source'),icon:FileSearch,title:t('Een datum is geen belofte.','A date is not a promise.'),body:t('Documenten kunnen verwachtingen beschrijven in plaats van toezeggingen. Zonder context en bindendheid kan een datum misleiden.','Documents can describe expectations rather than commitments. Without context and binding status, a date can mislead.')},
  ];
  const stages=[
    {name:t('Voorstel','Propose'),title:t('Het model stelt voor.','The model proposes.'),short:t('Claims uit documenten halen','Extract claims from documents'),body:t('De beoogde extractiestap haalt mogelijke claims en hun citaten uit documenten. Het huidige product gebruikt deze stap nog niet voor echte antwoorden.','The intended extraction step proposes claims and quotations from documents. The current product does not yet use this step for real answers.'),icon:Sparkles},
    {name:t('Controle','Verify'),title:t('De gate controleert.','The gate checks.'),short:t('Controleer de onderbouwing','Check the evidence'),body:t('Een deterministische gate controleert onder meer of het citaat, de datum en het vermogen in de bron staan. Hij begrijpt betekenis niet volledig: sommige verkeerde toeschrijvingen passeren nog.','A deterministic gate checks, among other things, whether the quote, date and capacity appear in the source. It does not fully understand meaning: some misattributions still pass.'),icon:ShieldCheck},
    {name:t('Mens','Decide'),title:t('De mens blijft aan zet.','The person stays in control.'),short:t('Antwoord of eerlijke weigering','An answer or an honest refusal'),body:t('Alleen met voldoende controleerbare bronnen is een onderbouwd antwoord het doel. Anders zegt GridQueue ‘onbekend’ en helpt een belscript u verder. Er wordt nooit automatisch een aanvraag ingediend.','A supported answer is the goal only when there is enough verifiable evidence. Otherwise GridQueue says “unknown” and offers a phone script. It never submits an application automatically.'),icon:UserRound},
  ];
  const active=stages[step],ActiveIcon=active.icon;
  return <main className="story-shell" aria-label={t('Introductie van GridQueue','Introduction to GridQueue')}>
    <div className="story-top"><div className="story-kicker"><span className="story-dot"/> {t('EEN ONAFHANKELIJK INZICHT','AN INDEPENDENT PERSPECTIVE')} <span>/</span> {t('NETCAPACITEIT','GRID CAPACITY')}</div><button className="story-skip" onClick={()=>go('/demo')}>{t('Direct naar demo','Skip to demo')} <MoveUpRight size={14}/></button></div>
    {slide===1?<section className="story-slide" aria-labelledby="problem-title">
      <div className="story-content"><div className="story-chapter"><span>01</span><span className="story-chapter-line"/> {t('HET PROBLEEM','THE PROBLEM')}</div>
        <h1 id="problem-title">{t('Een simpele vraag.','A simple question.')}<br/><em>{t('Geen simpel antwoord.','No simple answer.')}</em></h1>
        <p className="story-lead">{t('Een bedrijf wil uitbreiden, elektrificeren of energie terugleveren. Eerst moet het weten of er op die plek netcapaciteit is—en wat een eventuele wachttijd betekent.','A business wants to expand, electrify or feed energy back into the grid. First it needs to know whether capacity is available at its location—and what any wait actually means.')}</p>
        <div className="story-divider"/>
        <div className="story-insight"><div className="story-insight-icon"><HelpCircle size={19}/></div><div><span>{t('DE INFORMATIEPUZZEL','THE INFORMATION PUZZLE')}</span><p>{t('Het antwoord hangt af van locatie, richting en actuele publicaties. Een losse kaartkleur of datum is geen bevestiging voor een specifieke aansluiting.','The answer depends on location, direction and current publications. A map colour or isolated date is not confirmation for a specific connection.')}</p></div></div>
      </div>
      <div className="story-visual problem-visual"><div className="visual-label"><span>{t('DE VRAAG ACHTER DE VRAAG','THE QUESTION BEHIND THE QUESTION')}</span><span>{t('SCHEMATISCH','SCHEMATIC')}</span></div><NetworkIllustration/>
        <div className="question-card"><span className="question-mark">?</span><div><span className="question-caption">{t('DE VRAAG','THE QUESTION')}</span><strong>{t('Kan ik hier stroom krijgen, en wanneer?','Can I get power here, and when?')}</strong></div></div>
        <div className="lens-block"><div className="lens-heading"><span>{t('WAT MAAKT HET INGEWIKKELD?','WHAT MAKES IT COMPLICATED?')}</span><span>{t('KLIK OM TE ONTDEKKEN','CLICK TO EXPLORE')}</span></div><div className="lens-tabs" role="group" aria-label={t('Kies een aspect','Choose an aspect')}>{lenses.map((item,i)=>{const Icon=item.icon;return <button key={i} aria-pressed={lens===i} onClick={()=>setLens(i)}><Icon size={15}/>{item.name}</button>})}</div><div className="lens-description" aria-live="polite"><strong>{lenses[lens].title}</strong><p>{lenses[lens].body}</p></div></div>
      </div>
    </section>:<section className="story-slide solution-slide" aria-labelledby="solution-title">
      <div className="story-content"><div className="story-chapter"><span>02</span><span className="story-chapter-line"/> {t('ONZE AANPAK','OUR APPROACH')}</div>
        <h1 id="solution-title">{t('Minder gokken.','Less guessing.')}<br/><em>{t('Meer onderbouwing.','More evidence.')}</em></h1>
        <p className="story-lead">{t('GridQueue wil publicaties omzetten in een antwoord dat u kunt controleren. Niet door een datum te voorspellen, maar door te laten zien wat wel en niet onderbouwd is.','GridQueue aims to turn publications into an answer you can check. Not by predicting a date, but by showing what the evidence can—and cannot—support.')}</p>
        <div className="story-quote"><span>“</span><p>{t('Het model stelt voor, de gate controleert, de mens blijft aan zet.','The model proposes, the gate checks, the person stays in control.')}</p></div>
        <div className="story-status"><span className="status-indicator"/><div><strong>{t('Eerlijke status van deze demo','Honest status of this demo')}</strong><p>{t('Het bestaande controlesysteem gebruikt synthetische testdata. Officiële documenten en postcodekoppelingen zijn nog niet geverifieerd; de demo geeft daarom ‘onbekend’.','The existing verification engine uses synthetic test data. Official documents and postcode mappings are not yet verified, so the demo returns “unknown”.')}</p></div></div>
      </div>
      <div className="story-visual approach-visual"><div className="visual-label"><span>{t('VAN VRAAG NAAR VERANTWOORD ANTWOORD','FROM QUESTION TO RESPONSIBLE ANSWER')}</span><span>{t('WERKWIJZE','THE WORKFLOW')}</span></div><div className="flow-list" role="group" aria-label={t('Ontdek de stappen','Explore the steps')}>{stages.map((item,i)=>{const Icon=item.icon;return <button key={i} className={step===i?'flow-step selected':'flow-step'} onClick={()=>setStep(i)} aria-pressed={step===i}><span className="flow-num">0{i+1}</span><span className="flow-icon"><Icon size={18}/></span><span className="flow-name"><strong>{item.name}</strong><small>{item.short}</small></span><ArrowRight size={17}/></button>})}</div>
        <div className="flow-detail" aria-live="polite"><span className="flow-detail-icon"><ActiveIcon size={20}/></span><div><span className="flow-detail-label">{t('STAP','STEP')} 0{step+1} / 03</span><h2>{active.title}</h2><p>{active.body}</p></div></div>
        <div className="flow-rule"><Fingerprint size={17}/><span>{t('Geen bron? Geen gok.','No source? No guess.')}</span><span><Check size={13}/> {t('MENS HOUDT REGIE','HUMAN IN CONTROL')}</span></div>
      </div>
    </section>}
    <div className="story-controls"><div className="story-progress"><span>{t('INTRODUCTIE','INTRODUCTION')}</span><div className="story-dots" role="group" aria-label={t('Introductieslides','Introduction slides')}><button aria-label={t('Slide 1: het probleem','Slide 1: the problem')} aria-current={slide===1?'step':undefined} onClick={()=>go('/')}/><button aria-label={t('Slide 2: onze aanpak','Slide 2: our approach')} aria-current={slide===2?'step':undefined} onClick={()=>go('/intro/2')}/></div><strong>0{slide} <span>/ 02</span></strong></div><div className="story-actions">{slide===2&&<button className="story-back" onClick={()=>go('/')}><ArrowLeft size={16}/> {t('Vorige','Back')}</button>}<button className="story-next" onClick={()=>go(slide===1?'/intro/2':'/demo')}>{slide===1?t('Bekijk onze aanpak','See our approach'):t('Open de demo','Open the demo')} <ArrowRight size={17}/></button></div></div>
  </main>;
}

function NetworkIllustration(){const {t}=useLanguage();return <svg className="network-illustration" viewBox="0 0 570 230" role="img" aria-label={t('Illustratief netwerkschema','Illustrative network diagram')}>
  <defs><pattern id="story-grid" width="27" height="27" patternUnits="userSpaceOnUse"><path d="M27 0H0V27" fill="none" stroke="#ffffff" strokeOpacity=".055"/></pattern><radialGradient id="story-glow"><stop stopColor="#82b995" stopOpacity=".2"/><stop offset="1" stopColor="#82b995" stopOpacity="0"/></radialGradient></defs>
  <rect width="570" height="230" fill="url(#story-grid)"/><ellipse cx="284" cy="108" rx="230" ry="145" fill="url(#story-glow)"/>
  <g className="network-traces" fill="none" stroke="#afcfb7" strokeOpacity=".28" strokeWidth="1.2"><path d="M0 117H82L113 72H197L230 112H295L332 54H419L451 94H570"/><path d="M0 165H105L139 128H198L230 112L265 161H350L388 124H452L485 155H570"/><path d="M0 57H62L105 99H145L175 57H241L268 83H315L332 54"/><path d="M112 230V181L139 128M198 0V42L175 57M350 230V161M451 94L451 0M485 155V230"/></g>
  <g fill="#95c6a1"><circle cx="113" cy="72" r="3"/><circle cx="139" cy="128" r="3"/><circle cx="175" cy="57" r="3"/><circle cx="230" cy="112" r="4"/><circle cx="265" cy="161" r="3"/><circle cx="332" cy="54" r="3"/><circle cx="388" cy="124" r="3"/><circle cx="451" cy="94" r="3"/><circle cx="485" cy="155" r="3"/></g>
  <circle className="network-pulse" cx="230" cy="112" r="12" fill="none" stroke="#b8e2bb" strokeOpacity=".7"/><circle cx="230" cy="112" r="7" fill="#c4e7c7"/>
</svg>}
