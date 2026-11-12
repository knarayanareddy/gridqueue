// Run with the dev server up: CHROMIUM_PATH=/path/to/chromium npm run test:i18n
import { chromium } from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined, headless:true, args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.BASE_URL || 'http://127.0.0.1:5173';
const expect=(ok,message)=>{if(!ok)throw new Error(message)};
try {
 for (const width of [390,768,1440]) {
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const noOverflow=async label=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${width}: overflow on ${label}`);
  const lang=()=>page.locator('html').getAttribute('lang');
  await page.goto(base+'/');
  expect(await lang()==='en','English should be the default');
  expect(await page.getByRole('heading',{name:/A simple question/}).isVisible(),'first intro slide');
  await page.getByRole('button',{name:'Direction',exact:true}).click();
  expect(await page.getByText('Taking power is not the same as feeding it in.').isVisible(),'interactive problem lens');
  await noOverflow('intro 1 EN');
  await page.getByRole('button',{name:'See our approach'}).click();
  expect(await page.getByRole('heading',{name:/Less guessing/}).isVisible(),'second intro slide');
  await noOverflow('intro 2 EN');
  await page.getByRole('button',{name:/Verify Check the evidence/}).click();
  expect(await page.getByText('The gate checks.').isVisible(),'interactive workflow');
  await page.getByRole('button',{name:'NL',exact:true}).click();
  expect(await page.getByText('De gate controleert.').isVisible(),'workflow language switch preserves selection');
  await noOverflow('intro 2 NL');
  await page.getByRole('button',{name:'Vorige'}).click();
  expect(await page.getByText('Stroom afnemen is niet hetzelfde als terugleveren.').isVisible(),'back preserves lens');
  await noOverflow('intro 1 NL');
  await page.goBack();expect(await page.getByText('De gate controleert.').isVisible(),'browser back restores slide');
  await page.goForward();expect(await page.getByText('Stroom afnemen is niet hetzelfde als terugleveren.').isVisible(),'browser forward restores slide');
  await page.getByRole('button',{name:'Bekijk onze aanpak'}).click();
  await page.getByRole('button',{name:'Open de demo'}).click();
  expect(await page.getByText('Bekijk uw situatie').isVisible(),'demo after slides');
  await page.goto(base+'/intro/2');expect(await page.getByRole('heading',{name:/Minder gokken/}).isVisible(),'direct intro route');
  await page.getByRole('button',{name:'Direct naar demo'}).click();expect(await page.getByText('Bekijk uw situatie').isVisible(),'skip to demo');
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await page.goto(base+'/demo');expect(await page.getByText('Check your situation').isVisible(),'direct demo route');
  if(width<650)await page.getByRole('button',{name:'Menu'}).click();
  await page.getByRole('link',{name:'Coverage',exact:true}).click();
  expect(await page.getByText('Where do we have evidence?',{exact:true}).isVisible(),'English navigation');
  await page.getByRole('link',{name:/GridQueue/}).first().click();
  await page.getByRole('button',{name:'Skip to demo'}).click();
  await page.getByPlaceholder('E.g. 5612 AB').fill('5612 AB');
  await page.getByPlaceholder('E.g. 2500').fill('2500');
  await page.getByRole('button',{name:'Check situation'}).click();
  expect(await page.getByText('We don’t know yet.').isVisible(),'English refusal');
  expect(await page.locator('blockquote[lang=nl]').innerText().then(x=>x.includes('Goedemiddag')),'Dutch script preserved');
  await page.getByText('English translation (for reference)').click();expect(await page.getByText(/Hello, this is/).isVisible(),'English translation is labelled and available');
  await page.getByRole('button',{name:'NL',exact:true}).click();
  expect(await lang()==='nl' && await page.getByText('We weten het nog niet.').isVisible(),'Dutch refusal / lang');
  expect(await page.locator('blockquote[lang=nl]').innerText().then(x=>x.includes('5612 AB')&&x.includes('2500')),'form state survives switch');
  await noOverflow('Dutch home');
  await page.reload();expect(await lang()==='nl','language persists on reload');
  for(const [path,title] of [['/gebieden','Waar hebben we bewijs?'],['/ab','De toets, inclusief de fout.'],['/energie','Wat kost een antwoord?'],['/onbekend/5613','We weten het nog niet.']]){
   await page.goto(base+path);expect(await page.getByText(title,{exact:true}).isVisible(),`Dutch ${path}`);await noOverflow(path+' NL');
  }
  await page.goto(base+'/swarm');
  await page.getByRole('button',{name:'Stap',exact:true}).click();
  await page.getByLabel('KIES EEN AGENT').selectOption('0');
  await page.getByText('Synthetische enquête-antwoorden').click();
  expect(await page.getByText('Hoe bruikbaar is een indicatieve datum?').isVisible(),'Dutch survey questions');
  await page.getByRole('button',{name:'EN',exact:true}).click();
  expect(await lang()==='en' && await page.getByText('How useful is an indicative date?').isVisible(),'translated agent questions');
  expect((await page.locator('.scrub').innerText()).includes('ROUND 01'),'round preserved on switch');
  expect((await page.getByLabel('CHOOSE AN AGENT').inputValue())==='0','selected agent preserved');
  await page.getByRole('button',{name:'Survey',exact:true}).click();await page.getByRole('button',{name:'Step',exact:true}).click();
  expect((await page.locator('.survey-summary').innerText()).includes('10 / 240'),'English survey playback');
  await page.getByRole('button',{name:'Adoption',exact:true}).click();expect(await page.getByText('FICTIONAL USE · ROUND 1').isVisible(),'English adoption');
  await page.getByLabel('Choose a story').selectOption('5');
  await page.getByRole('button',{name:'02 · Report'}).click();await page.getByText('Predefined falsifiers').waitFor({timeout:30000});
  expect((await page.locator('.frequency-table').innerText()).includes('A majority of SMEs'),'English report');
  const countsEN=(await page.locator('.frequency-table').innerText()).match(/\d+ \/ \d+ runs/g);
  await noOverflow('swarm report EN');
  await page.getByRole('button',{name:'NL',exact:true}).click();
  expect(await page.getByText('Vooraf vastgelegde falsifiers').isVisible(),'Dutch report');
  expect((await page.locator('.frequency-table').innerText()).includes('Een meerderheid van MKB'),'Dutch report questions');
  const countsNL=(await page.locator('.frequency-table').innerText()).match(/\d+ \/ \d+ runs/g);expect(JSON.stringify(countsEN)===JSON.stringify(countsNL),'language must not alter model results');
  await noOverflow('swarm report NL');
  await page.getByRole('button',{name:'EN',exact:true}).click();
  for(const [path,title] of [['/gebieden','Where do we have evidence?'],['/ab','The test, including the failure.'],['/energie','What does an answer cost?'],['/onbekend/5613','We don’t know yet.']]){
   await page.goto(base+path);expect(await page.getByText(title,{exact:true}).isVisible(),`English ${path}`);if(path==='/ab'){await page.getByText('View individual test cases').click();expect((await page.locator('.cases').innerText()).includes('Gate on:'),'English case labels');}await noOverflow(path+' EN');
  }
  await page.reload();expect(await lang()==='en','English persists on reload');
  expect(errors.length===0,`${width}: ${errors.join('; ')}`);
  console.log(`${width}px: bilingual routes, refusal, profile, survey, adoption, report, persistence and overflow passed`);
  await context.close();
 }
} finally {await browser.close()}
