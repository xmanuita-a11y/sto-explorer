const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/STO_Reader_Offline.html').href);
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert(await page.locator('#language').isVisible());
  const bounds=await page.locator('#language').boundingBox();assert(bounds.x>1200&&bounds.y<100);
  await page.locator('#language').selectOption('it');assert.equal(await page.locator('html').getAttribute('lang'),'it');
  await page.locator('#language').selectOption('en');
  await page.click('#demo');await page.waitForFunction(()=>panes[0].setup);
  await page.evaluate(()=>new Promise(resolve=>{let frames=6;function tick(){if(--frames)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);}));
  assert(await page.locator('#boot-error').isHidden());
  assert(await page.locator('#save-main').isDisabled());
  assert.equal(await page.locator('.garage-pane').count(),1);
  const fixture=require('./sto-demo-data.json').samples[1];
  await page.locator('#file-second').setInputFiles({name:'SYNTHETIC-second.sto',mimeType:'application/octet-stream',buffer:Buffer.from(fixture.base64,'base64')});
  await page.waitForFunction(()=>panes[1].setup);
  assert.equal(await page.locator('.garage-pane').count(),2);
  const boxes=await page.locator('.garage-pane').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));
  assert(boxes[1].x>boxes[0].x);assert.equal(boxes[1].y,boxes[0].y);
  for(const car of ['stockcars\\toyotacamry2022','ferrari296gt3','porsche963gtp']){
   const result=await page.evaluate(car=>{
    const pr=STO_NATIVE_GARAGE_CATALOG.profiles.find(p=>p.identity.car===car);
    panes[0].setup={car,version:3,contentVersion:pr.identity.contentVersion,entries:[{name:'lfTireColdPressPa',value:'172368.921',line:1,occurrence:1}],unparsed:[],name:'SYNTHETIC',notes:'Synthetic notes',text:'',tailSize:0};panes[0].page=null;render();
    return document.querySelectorAll('[data-pane="0"] .sto-native-surface').length;
   },car);assert.equal(result,1,car);
  }
  await page.evaluate(()=>{const pr=STO_NATIVE_GARAGE_CATALOG.profiles.find(p=>p.identity.car==='ferrari296gt3');panes[1].setup={...panes[0].setup,car:pr.identity.car,contentVersion:pr.identity.contentVersion,name:'SYNTHETIC Ferrari'};panes[1].page=null;render();});
  assert.equal(await page.locator('.sto-native-surface').count(),2);
  const right=await page.locator('[data-pane="1"]').textContent();
  await page.locator('[data-pane="0"] select').selectOption('imperial');
  assert.equal(await page.locator('[data-pane="1"]').textContent(),right);
  await page.getByRole('button',{name:'NOTES',exact:true}).first().click();
  assert.match(await page.locator('[data-pane="0"]').textContent(),/Synthetic notes/);
  await page.locator('[data-pane="0"] .tabs button').first().click();
  await page.locator('#file-main').setInputFiles({name:'invalid.sto',mimeType:'application/octet-stream',buffer:Buffer.from('invalid')});
  await page.waitForFunction(()=>panes[0].error);assert(await page.locator('[data-pane="0"] [role="alert"]').isVisible());
  assert.equal(await page.locator('[data-pane="1"]').textContent(),right);
  await page.evaluate(()=>{panes[0].error='';render();});
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
  await page.locator('[data-pane="1"]').getByRole('button',{name:'Close',exact:true}).click();
  assert.equal(await page.locator('.garage-pane').count(),1);
  for(const width of [900,1600,1100,1600]){await page.setViewportSize({width,height:1000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert(await page.locator('#boot-error').isHidden());}
  await page.setViewportSize({width:390,height:844});assert(await page.locator('#language').isVisible());
  for(const text of ['Black box','In-car','Dash','Compare'])assert.equal(await page.getByRole('button',{name:text,exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: single/two independent garages, file load/errors, native profiles, isolated tabs/units, close, language and mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
