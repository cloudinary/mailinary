const cloudinary = require('cloudinary');
const puppeteer = require('puppeteer');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
let mailer = require("./mailer.js");
const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);

class Scraper {
  constructor(options) {
    this.options = options;
    this.browser = null;
    this.page = null;
    this.id = options.session_id || uuidv4();
    this.runAt = moment();
  }

  async load() {
    try {
      let headless = !(process.env.DEBUG_UI == 1);
      this.browser = await puppeteer.launch({ headless, ignoreHTTPSErrors: true, args: ['--enable-features=NetworkService'] });
      this.page = await this.browser.newPage();
    } catch (e) {
      log.error("failed to initialize puppeteer");
      throw e;
    }

    let windowOpts = Object.assign({ width: 1000, height: 1000 }, this.options.window)
    this.page.setViewport({ width: windowOpts.width, height: windowOpts.height, deviceScaleFactor: 3 });

    let url = this.options.url;
    log.debug(`loading page: ${url}`);

    try {
      await this.page.goto(url, { timeout: 30000, waitUntil: 'networkidle0' });
    } catch (e) {
      log.error(`failed loading page ${url}`);
      throw e;
    }

    let redirected_to_login = this.page.url() != url;
    let login_options = this.options.login_form;
    if (login_options && redirected_to_login) {
      if (typeof (login_options) == 'function') {
        await login_options(this.page);
      } else {
        for (let selector in login_options) {
          let value = login_options[selector];
          if (typeof (value) == 'string') {
            await this.page.focus(selector);
            await this.page.keyboard.type(value);
          } else if (typeof (value) == 'function') {
            await value(this.page, selector);
          }
        }
        await this.page.waitForNavigation();
      }
      await this.page.goto(url, { timeout: 30000, waitUntil: 'networkidle0' });
    }

    if (this.options.page_load_timeout) {
      log.debug(`waiting additional ${this.options.page_load_timeout} seconds (options.page_load_timeout)`);
      await new Promise((resolve) => { setTimeout(resolve, (this.options.page_load_timeout || 0) * 1000); });
    }
  }

  async getPageHTML() {
    let res = await this.page.evaluate(() => {
      return document.body.innerHTML;
    });
    return res;
  }

  isRegexpSelector(selector) {
    return selector instanceof RegExp || selector.match(/^\/.*\/[gimuy]*$/);
  }

  findElements(regexpSelector, html) {
    let re;
    if (regexpSelector instanceof RegExp) {
      re = regexpSelector;
    } else {
      let [_, exp, flags] = regexpSelector.match(/\/(.*)\/([gimy]*)$/);
      re = new RegExp(exp, flags);
    }

    let selectors = [];
    let matches = null;

    while ((matches = re.exec(html)) !== null) {
      let usingCapturingGroups = matches.length > 1;
      if (usingCapturingGroups) {
        matches.shift();
      }
      matches = matches.map((match) => `#${match}`); // add css selector syntax
      selectors = selectors.concat(matches);
    }

    return selectors;
  }

  async scrape() {
    let html = await this.getPageHTML();
    let selectors = this.evaluateSelectors(html);
    let empty_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg=="

    for (let selector of selectors) {
      let replacement_image_path = empty_image;
      let screenshot_id = uuidv4();

      try {

        log.info(`takeing a screenshot for ${selector}`);
        let buff = await this.screenshotDOMElement({
          path: `tmp/element_${screenshot_id}.jpg`,
          selector: selector,
          padding: 0,
        });

        log.info(`uploading to cloudinary as ${screenshot_id}`);
        if (process.env.CLOUDINARY_URL) {
          let resp = await cloudinary.v2.uploader.upload(
            `tmp/element_${screenshot_id}.jpg`,
            { public_id: screenshot_id, folder: `mailinary/${this.runAt.format('YYYYMMDDTHHMM')}/${this.id}`, quality: 'auto:eco' },
            (result) => { },
          );
          replacement_image_path = resp.secure_url
        } else {
          replacement_image_path = `data:image/png;base64,${buff.toString('base64')}`
        }


      } catch (e) {
        log.warn(`failed to process element ${selector}`)
        log.warn(e)

      } finally {
        log.info(`replacing element ${selector} content with image  ${replacement_image_path.substring(0, 100)}`);
        await this.replaceHtmlWithImage({
          path: `tmp/element_${screenshot_id}.jpg`,
          url: replacement_image_path,
          selector: selector,
          cid: screenshot_id,
        });
      }
    }
  }

  evaluateSelectors(html) {
    let selectors = this.options.selectors;
    selectors = selectors.map((selector) => {
      if (this.isRegexpSelector(selector)) {
        log.debug(`found regexp selector${selector}`);
        return this.findElements(selector, html);
      }
      return selector;

    });
    selectors = [].concat.apply([], selectors); // flat array
    log.debug(`evaluated selectors ${selectors.join(', ')}`);
    return selectors;
  }

  async removeHiddenElements() {
    await this.page.evaluate(() => {
      [].forEach.call(
        document.querySelectorAll('body *'),
        function (element) {
          var elementDisplay = element.currentStyle ? element.currentStyle.display : getComputedStyle(element, null).display;
          if (elementDisplay === 'none') {
            element.parentNode.removeChild(element);
          }
        }
      );
    });
  }

  async sentinel() {
    if (this.options.sentinel) {
      let valid = await this.options.sentinel.validate(this.page);
      if (!valid) {

        let body = 'aborted send , report with stale data';
        if (typeof (this.options.sentinel.error_notifier.body) == 'function') {
          body = await this.options.sentinel.error_notifier.body(this.page);
        }
        await mailer.send(body, this.options.sentinel.error_notifier);
        throw new Error("sentinel check failed ");
      }
    }
  }

  async execute() {
    await this.load();
    await this.sentinel();
    if (this.options.augmentHTMLBeforeScrape) {
      await this.options.augmentHTMLBeforeScrape(this.page);
    }
    await this.scrape();
    await this.removeHiddenElements();
    if (this.options.augmentHTMLBeforeSend) {
      await this.options.augmentHTMLBeforeSend(this.page);
    }
    let html = await this.getPageHTML();
    this.browser.close();
    await this.saveOutputForDebug(html);

    return html;
  }

  async saveOutputForDebug(html) {
    let filePath = `./tmp/mail-${this.id}.html`;
    log.debug(`writing mail content to ${filePath}`);
    await writeFile(filePath, html);
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
      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height, id: element.id };
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

  async replaceHtmlWithImage(opts = {}) {
    const path = 'path' in opts ? opts.path : null;
    const selector = opts.selector;

    await this.page.evaluate((selector, url) => {
      const element = document.querySelector(selector);
      if (!element.classList.contains('mailer-keep-original')) {
        element.innerHTML = `<img src="${url}" width="100%"/>`;
      }

    }, selector, opts.url);
  }
}

module.exports = Scraper;
