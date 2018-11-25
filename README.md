Mailinary
==========

Scheduled mail delivery of web content

Basically what it does it scrapes a url and replaces it's content or parts of it with screenshots, and sends it as a mail message.

I had an attachment version but eventualy went with image hosting since mail messages where too large.
Cloudinary, and sends the resulting HTML as a  mail message.


## Setup ######################################################################

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

### But i don't have a Cloudinary account

You can sign up for a [free account](https://cloudinary.com/users/register/free) .

To this date (nov 2018) Cloudinary's free plan includes 25 monthly credis (up to 25GB in storage / 25GB monthly bandwidth / 1000 monthly transformations)
which is more than plenty if you have a daily mail process in place.

Additional resources are available at:

* [Website](https://cloudinary.com)
* [Documentation](https://cloudinary.com/documentation)

## License #######################################################################

Released under the MIT license.

