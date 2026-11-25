const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const {chromium} = require("@playwright/test");
const root = path.resolve(__dirname,"../site/out");
const evidence = path.resolve(__dirname,"../../chart-browser-artifacts");
const prefix = "/ckbadger-explorer";
const server = http.createServer((req,res) => {
  const u = new URL(req.url,'http://localhost');
  if(!u.pathname.startsWith(prefix+'/')) return res.writeHead(404).end();
  let file = path.resolve(root,'.'+u.pathname.slice(prefix.length));
  if(!file.startsWith(root+path.sep)) return res.writeHead(404).end();
  for (const f of [file, file+'.html', path.join(file,'index.html'),path.join(root,'404.html')]) {
    if(fs.existsSync(f) && fs.statSync(f).isFile()){
      const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
      return res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}).end(fs.readFileSync(f));
    }
  }
  res.writeHead(404).end();
});
(async()=>{
  assert.ok(fs.existsSync(root));
  fs.mkdirSync(evidence,{recursive:true});
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const origin="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({});
  try {
    for(const [width,mode] of [[1440,'single'],[390,'dual'],[320,'single'],[320,'error'],[320,'empty']]){
      const page=await browser.newPage({viewport:{width,height:880},reducedMotion:'reduce'});
      await require('./home-browser-fixtures.cjs').install(page,origin);
      await page.route('**/charts/transaction-count',async r=>{
        if(!new URL(r.request().url()).pathname.includes('/api/')) return r.fallback();
        if(mode==='error') return r.fulfill({status:400,json:{error:'offline fixture'}});
        return r.fulfill({json:{title:'Transaction Count',yAxisLabel:'Transactions',...(mode==='dual'?{y2AxisLabel:'Secondary'}:{}),data:mode==='empty'?[]:Array.from({length:32},(_,i)=>({date:new Date(Date.UTC(2026,9,i+1)).toISOString().slice(0,10),value:String((i+8)**1.7+(i%5)*30),...(mode==='dual'?{value2:String((i+2)*88+(i%5)*240)}:{})}))}});
      });
      await page.goto(origin+prefix+'/mainnet/charts/transaction-count',{waitUntil:'domcontentloaded'});
      if(mode==='error') await page.getByRole('alert').filter({hasText:'Failed to load chart data'}).waitFor({timeout:12000});
      else if(mode==='empty') await page.getByRole('status').filter({hasText:'No data available'}).waitFor({timeout:12000});
      else {
        const chart=page.locator('.explorer-chart-svg');
        await chart.waitFor();
        if (width < 640) await page.locator('.explorer-chart-svg[data-compact=true]').waitFor();
        assert.equal((await chart.getAttribute('viewBox')).split(' ')[2], width < 640 ? '340' : '600');
        assert.equal(await chart.getByTestId('line-chart-x-tick').count(), width < 640 ? 3 : 5);
        const sizes = await chart.getByTestId('line-chart-x-tick').evaluateAll(nodes =>
          nodes.map(e => ({px: parseFloat(getComputedStyle(e).fontSize) * e.getScreenCTM().a,
             inside: e.getBoundingClientRect().left >= 0 && e.getBoundingClientRect().right <= innerWidth})));
        assert.ok(sizes.every(t => t.px >= (width === 320 ? 9 : 10) && t.inside), JSON.stringify(sizes));
        const log = page.getByRole('button',{name:'Log Scale'});
        await log.focus();
        await page.keyboard.press('Space');
        assert.equal(await log.getAttribute('aria-pressed'),'false');
        await page.keyboard.press('Space');
        assert.equal(await log.getAttribute('aria-pressed'),'true');
        if(width < 640) assert.ok((await log.boundingBox()).y+(await log.boundingBox()).height <= (await chart.boundingBox()).y + 1);
        assert.equal(await chart.locator('linearGradient').count(),mode==='single'?1:0);
        if(mode==='dual'){
          const second=chart.getByTestId('line-series-secondary');
          const rgba=await second.evaluate(e=>getComputedStyle(e).stroke);
          const legend=page.getByText('Secondary',{exact:true}).last();
          assert.equal(rgba,await legend.evaluate(e=>getComputedStyle(e.previousElementSibling).backgroundColor));
        }
        await chart.hover({position:{x:Math.round((await chart.boundingBox()).width*.55),y:Math.round((await chart.boundingBox()).height*.45)}});
      }
      const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
      assert.ok(size.scroll<=size.viewport+1,JSON.stringify(size));
      await page.screenshot({path:path.join(evidence,width+'-'+mode+'.png'),animations:'disabled'});
      console.log(width,mode,'passed');
      await page.close();
    }
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
