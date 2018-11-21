const cloudinary = require('cloudinary');
const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');

class Scraper{
  constructor(options){
    this.options = options;
    this.browser = null;
    this.page = null;
    this.id = uuidv4();
  }

  async load(){
    try{
      this.browser = await puppeteer.launch({headless:true, ignoreHTTPSErrors:true, args:['--enable-features=NetworkService']});
      this.page = await this.browser.newPage();
    }catch(e){
      log.error("failed to initialize puppeteer");
      throw e;
    }
    this.page.setViewport({width: 1000, height:1000, deviceScaleFactor: 3});

    let url = this.options.url;
    log.debug(`loading page: ${url}`);

    try{
      await this.page.goto(url, {timeout:30000, waitUntil: 'networkidle0'}); 
    }catch(e){
      log.error(`failed loading page $(url)`);
      throw e;
    }

    if (this.options.page_load_timeout){
      log.debug(`waiting additional ${this.options.page_load_timeout} seconds (options.page_load_timeout)`);
      await new Promise((resolve)=>{setTimeout(resolve, (this.options.page_load_timeout || 0 )*1000);});
    }
  }

  async getPageHTML(){
    let res = await this.page.evaluate(()=>{
      return document.body.innerHTML;
    });
    return res;
  }

  isRegexpSelector(selector){
    return selector.match(/^\/.*\/[gimuy]*$/);
  }

  findElements(regexpSelector, html){
    let [_, exp, flags] = regexpSelector.match(/\/(.*)\/([gimy]*)$/);
    let re = new RegExp(exp, flags);

    let selectors = [];
    let matches = null;

    while ((matches = re.exec(html)) !== null) {
      let usingCapturingGroups = matches.length>1;
      if (usingCapturingGroups){
        matches.shift();
      }
      matches = matches.map((match)=>`#${match}`); // add css selector syntax
      selectors = selectors.concat(matches);
    }

    return selectors;
  }

  async scrape(){
    let html = await this.getPageHTML();
    let selectors = this.evaluateSelectors(html);

    for (let selector of selectors){

      let screenshot_id = uuidv4();
      await this.screenshotDOMElement({
        path: `tmp/element_${screenshot_id}.jpg`,
        selector: selector,
        padding: 0,
      });

      let resp = await cloudinary.v2.uploader.upload(
        `tmp/element_${screenshot_id}.jpg`, 
        {public_id:screenshot_id, folder:this.id, quality: 'auto:eco'}, 
        (result)=> {},
      );

      await this.replaceHtmlWithImage({
        path: `tmp/element_${screenshot_id}.jpg`,
        url: resp.secure_url,
        selector: selector,
        cid: screenshot_id,
      });
    }
  }

  evaluateSelectors(html){
    let selectors = this.options.selectors;
    selectors  = selectors.map((selector)=>{
      if (this.isRegexpSelector(selector)){
        log.debug(`found regexp selector${selector}`);
        return this.findElements(selector, html);
      }
      return selector;

    });
    selectors = [].concat.apply([], selectors); // flat array
    log.debug(`evaluated selectors ${selectors.join(', ')}`);
    return selectors;
  }

  async removeHiddenElements(){
    await this.page.evaluate(()=>{
      let hiddenElements =  Array.from($('*:hidden'));
      for (let elem of hiddenElements){
        elem.parentNode.removeChild(elem);
      }
    });
  }

  async execute(){
    await this.load();
    await this.scrape();
    await this.removeHiddenElements();
    let html = await this.getPageHTML();
    this.browser.close();
    return html;
  }

  async screenshotDOMElement(opts = {}) {
    const padding = 'padding' in opts ? opts.padding : 0;
    const path = 'path' in opts ? opts.path : null;
    const selector = opts.selector;

    if (!selector)
      throw Error('Please provide a selector.');

    const rect = await this.page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (!element)
        return null;
      const {x, y, width, height} = element.getBoundingClientRect();
      return {left: x, top: y, width, height, id: element.id};
    }, selector);

    if (!rect)
      throw Error(`Could not find element that matches selector: ${selector}.`);


    log.debug(`saving temp image to ${path}`);
    return await this.page.screenshot({
      path,
      type: 'jpeg',
      quality: 50,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      }
    });
  }

  async replaceHtmlWithImage(opts = {}){
    const path = 'path' in opts ? opts.path : null;
    const selector = opts.selector;

    await this.page.evaluate((selector, url) => {
      const element = document.querySelector(selector);
      if (!element.classList.contains('mailer-keep-original')){
        element.innerHTML = `<img src="${url}" width="100%"/>`;
      }


    }, selector, opts.url);
  }
}

module.exports = Scraper;
