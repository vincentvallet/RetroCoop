import {expect,test} from '@playwright/test';

test('catalogue progressif sans optimisation dynamique des jaquettes',async({page})=>{
  const imageRequests:string[]=[];page.on('request',request=>{if(request.resourceType()==='image')imageRequests.push(request.url())});
  await page.goto('/catalogue');await expect(page.locator('.catalogue-grid .card')).toHaveCount(371);
  const covers=page.locator('.catalogue-grid img[alt^="Jaquette de "]');await expect(covers).toHaveCount(371);await page.waitForTimeout(1000);
  const optimizedPrepared=imageRequests.filter(url=>url.includes('/_next/image')).filter(url=>{const decoded=decodeURIComponent(url);return decoded.includes('/covers/')||decoded.includes('/gameplay/')});
  expect(optimizedPrepared).toHaveLength(0);expect(imageRequests.filter(url=>url.includes('/covers/')).length).toBeLessThan(40);
  const loading=await covers.evaluateAll(images=>images.reduce((counts,image)=>{counts[(image as HTMLImageElement).loading]++;return counts},{eager:0,lazy:0}));expect(loading.eager).toBe(6);expect(loading.lazy).toBe(365);
  const firstSource=await covers.first().getAttribute('src');expect(firstSource).toMatch(/\/covers\/.+-[a-f0-9]{8}\.webp$/);const response=await page.request.get(firstSource!);expect(response.headers()['cache-control']).toContain('max-age=31536000');expect(response.headers()['cache-control']).toContain('immutable');
  const scrollPosition=await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,document.documentElement.scrollHeight);return window.scrollY});expect(scrollPosition).toBeGreaterThan(1000);await page.waitForTimeout(500);
  expect(imageRequests.filter(url=>url.includes('/_next/image')).filter(url=>{const decoded=decodeURIComponent(url);return decoded.includes('/covers/')||decoded.includes('/gameplay/')})).toHaveLength(0);
});
