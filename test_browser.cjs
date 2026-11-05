// Optional real-browser checks: install Playwright, then run node test_browser.cjs.
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/STO_Reader_Offline.html').href);
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert(await page.locator('#language').isVisible());
  const bounds=await page.locator('#language').boundingBox();assert(bounds.x>1000&&bounds.y<100);
  await page.locator('#language').selectOption('it');assert.equal(await page.locator('html').getAttribute('lang'),'it');
  await page.locator('#language').selectOption('en');
  await page.evaluate(()=>document.getElementById('demo').click());
  await page.waitForFunction(()=>state.a&&state.b);
  assert.match(await page.locator('#stats').textContent(),/different|diversi/);
  await page.evaluate(()=>{document.getElementById('view').value='table';render();});
  assert(await page.locator('#rows tr').count()>2);
  // Exercise each native profile with synthetic state, never a private setup.
  for(const car of ['stockcars\\toyotacamry2022','ferrari296gt3','porsche963gtp']){
   const result=await page.evaluate(car=>{
    const pr=STO_NATIVE_GARAGE_CATALOG.profiles.find(p=>p.identity.car===car);
    state.a={car,version:3,contentVersion:pr.identity.contentVersion,entries:[{name:'lfTireColdPressPa',value:'172368.921',line:1,occurrence:1}],unparsed:[],name:'SYNTHETIC',notes:'',text:'',tailSize:0};state.b=null;
    $('view').value='garage';$('units').value='metric';$('search').value='';$('group').value='';$('diff-only').checked=false;garagePage='tires';render();
    return {surfaces:document.querySelectorAll('.sto-native-surface').length,boot:$('boot-error').hidden};
   },car);
   assert.equal(result.surfaces,1,car);assert(result.boot);
  }
  await page.setViewportSize({width:390,height:844});assert(await page.locator('#language').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: real browser boot, language switch, A/B demo, table and three exact native profiles; mobile language control');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
