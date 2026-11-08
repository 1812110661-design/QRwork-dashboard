// Run with Node.js; uses an isolated browser context and never touches real user records.
const {chromium}=require('C:/Users/zzzqr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
 await context.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.goto(pathToFileURL(path.resolve('index.html')).href);
 await page.screenshot({path:'preview-desktop.png',fullPage:true});
 const nav=async(name)=>page.locator('#navigation [data-page="'+name+'"]').click();
 const submit=async(type,values)=>{const form=page.locator('form[data-form="'+type+'"]');for(const [key,value] of Object.entries(values)){const el=form.locator('[name="'+key+'"]');if(await el.evaluate(e=>e.tagName==='SELECT'))await el.selectOption(value);else await el.fill(value)}await form.locator('[type="submit"]').click()};
 await nav('weight');
 await submit('weight',{slot:'晨起',value:'62.5',note:'晨起记录'});
 await submit('weight',{slot:'晨起',value:'62.3',note:'修正'});
 await submit('weight',{slot:'睡前',value:'63.1'});
 await submit('meal',{type:'早餐',calories:'350',food:'燕麦与鸡蛋'});
 assert.equal(await page.evaluate(()=>db.weights.length),2);
 assert.equal(await page.evaluate(()=>morning(viewDate)),62.3);
 assert.equal(await page.locator('#weightDaily svg').count(),1);
 await page.screenshot({path:'preview-weight.png',fullPage:true});
 await nav('money');
 await submit('transaction',{type:'expense',category:'餐饮',amount:'25.50',note:'午餐'});
 await submit('transaction',{type:'income',category:'其他',amount:'1000',note:'收入'});
 assert.equal(await page.evaluate(()=>finance().spent),25.5);
 assert.equal(await page.evaluate(()=>finance().saved),974.5);
 assert.equal(await page.evaluate(()=>finance().remaining),2974.5);
 await nav('review');await page.locator('[data-tab="daily"]').click();
 await submit('task',{text:'英语阅读一篇'});
 await page.locator('[data-task]').check();
 await submit('study',{minutes:'45',note:'阅读练习'});
 assert.equal(await page.evaluate(()=>learning(viewDate)),45);
 assert.equal(await page.evaluate(()=>db.tasks[0].done),true);
 await nav('habits');await page.locator('[data-action="check"]').first().click();
 await submit('habit',{name:'阅读十页'});
 assert.equal(await page.evaluate(()=>db.checks[viewDate].length),1);
 await nav('notes');await page.locator('[data-action="new-note"]').click();
 await submit('note',{title:'第一张便签',content:'<img src=x onerror=alert(1)>\n保留换行'});
 assert.equal(await page.locator('.note img').count(),0);
 await page.locator('[data-action="pin-note"]').click();
 await page.reload();
 assert.equal(await page.evaluate(()=>db.notes[0].important),true);
 assert.equal(await page.evaluate(()=>db.weights.length),2);
 assert.equal(await page.evaluate(()=>db.transactions.length),2);
 assert.equal(await page.evaluate(()=>learning(viewDate)),45);
 await nav('overview');
 const overview=await page.locator('#content').innerText();
 for(const text of ['62.3','25.50','49'])assert.ok(overview.includes(text));
 await page.screenshot({path:'preview-filled.png',fullPage:true});
 const yesterday=await page.evaluate(()=>shift(today,-1));
 await page.locator('#viewDate').fill(yesterday);await page.locator('#viewDate').dispatchEvent('change');
 await nav('weight');await submit('weight',{slot:'晨起',value:'62.8'});
 assert.equal(await page.evaluate(d=>morning(d),yesterday),62.8);
 await page.locator('[data-action="today"]').click();
 assert.equal(await page.evaluate(()=>morning(viewDate)),62.3);
 await nav('money');await page.locator('[data-action="delete-record"]').first().click();
 assert.equal(await page.evaluate(()=>db.transactions.length),1);
 await nav('notes');await page.locator('[data-action="edit-note"]').click();
 await submit('note',{title:'修改后的标题',content:'新的内容'});
 assert.equal(await page.locator('.note h3').innerText(),'修改后的标题');
 await page.locator('[data-action="delete-record"]').click();
 assert.equal(await page.evaluate(()=>db.notes.length),0);
 await nav('review');await page.locator('[data-tab="stage"]').click();await page.locator('[data-action="new-stage"]').click();
 await submit('stage',{name:'额外复盘',start:'2026-01-10',end:'2026-01-01'});
 assert.ok(await page.locator('#modal').isVisible());
 assert.ok((await page.locator('#toast').innerText()).includes('结束日期'));
 await page.locator('[data-action="close-modal"]').click();
 const downloadWait=page.waitForEvent('download');await page.locator('.export-top').click();const download=await downloadWait;
 assert.ok(download.suggestedFilename().endsWith('.json'));
 for(const width of [1440,768,390]){
  await page.setViewportSize({width,height:1000});
  for(const section of ['overview','weight','money','review','habits','notes']){
   await nav(section);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} overflows at ${width}`);
  }
 }
 await nav('overview');await page.screenshot({path:'preview-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: all six sections; offline SVG; record creation/update/deletion; localStorage persistence; date isolation; finance and study totals; habit checking; note escaping/pinning/editing; invalid stage dates; JSON export; 1440/768/390px responsive layouts; no browser errors.');
 await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
