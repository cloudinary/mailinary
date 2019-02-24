Mailinary
==========

Scheduled mail delivery of web content

Basically what it does it scrapes a url and replaces it's content or parts of it with screenshots, and sends it as a mail message.

I had an attachment version but eventualy went with image hosting since mail messages where too large.
Cloudinary, and sends the resulting HTML as a  mail message.


## Setup 

1. clone the repository 
```
$ git clone git@github.com:cloudinary/mailinary.git
```
2. install dependencies
```
$ npm install
```
3. populate your environment configuration file (.env) 

```
SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=YOUR_SMTP_PORT
SMTP_SECURE=0
SMTP_AUTH_USER=YOUR_SMTP_AUTH_USER
SMTP_AUTH_PASS=YOUR_SMTP_AUTH_PASS
CLOUDINARY_URL=YOUR_CLOUDINARY_URL
```
4. test with a one time mail delivery
```
bin/mailinary --url https://marketplace.clicdata.com/v/yYF0JrwBkrHw --subject "it works 🔥" --from reports@YOUR_DOMAIN --to YOU@YOUR_DOMAIN --selectors '#dashboard'
```


### Job (configuration options): 

- `to` <[string]> recepient email address list seperated by comma.
- `from` <[string]> sender email address.
- `subject` <?[string|function]> email message subject, either as string or a function that receives html and options object.
- `url` <[string]> the url to scrape.
- `selectors` <[Array<[string|RegExp]>]> array of strings or regular expressions of selectors of elements that would be replaced with a screenshot.
- `page_load_timeout` <?[number]> add aditional wait time to page load.
- `schedule ` <[string]> schedule in cron expression.
- `login_form` <[Object|function]> either async function that receives a page handle and interacts with the page or an Object with element selector/value pairs .
- `sentinel` <[Object]> a kill switch configuration for stale reports.
  - `validate` <[function]> receives a handle to the element and checks if a condition is met.
  - `error_notifier` <[Object]> error notifier configuration.
    - `from` <[string]> sender email address.
    - `to` <[string]> error notification recepient email address list seperated by comma.
    - `subject` <?[string|function]> email message subject, either as string or a function that receives html and options object.


## Debugging tips

1. Turn off headless mode - sometimes it's useful to see what the browser is
   displaying. Instead of launching in headless mode, launch a full version of
   the browser using  `UI_DEBUG=1`:

        UI_DEBUG=1 bin/mailinary --job jobs/schedule/sample


### But i don't have a Cloudinary account

You can sign up for a [free account](https://cloudinary.com/users/register/free) .

To this date (nov 2018) Cloudinary's free plan includes 25 monthly credits (1 Credit equals 1000 transformations or 1GB of managed storage or 1GB of monthly viewing bandwidth)
which is more than plenty if you have a daily mail process in place.

Additional resources are available at:

* [Website](https://cloudinary.com)
* [Documentation](https://cloudinary.com/documentation)

## License #######################################################################

Released under the MIT license.

