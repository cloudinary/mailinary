Mailinary
==========

Mailinary is a utility for sending web content on scheduled intervals or on demand.

Basically what it does it scrapes a url and replaces it's content or parts of it with screenshots, which are hosted in Cloudinary, and sends the resulting HTML as a  mail message.


## Setup ######################################################################

clone the repository 

npn install 

setup .env (copy from env.sample)

bin/mailer --url https://marketplace.clicdata.com/v/yYF0JrwBkrHw --subject "my awsome mail $RANDOM" --from test@example.com --to test@example.com --selectors '#dashboard'

## Try it right away

Sign up for a [free account](https://cloudinary.com/users/register/free) .

update .env 

have fun


## Additional resources ##########################################################

Additional resources are available at:

* [Website](https://cloudinary.com)
* [Interactive demo](https://demo.cloudinary.com/default)
* [Documentation](https://cloudinary.com/documentation)
* [Knowledge Base](https://support.cloudinary.com/hc/en-us)
* [Documentation for Node.js integration](https://cloudinary.com/documentation/node_integration)
* [Node.js image upload documentation](https://cloudinary.com/documentation/node_image_upload)
* [Node.js image manipulation documentation](https://cloudinary.com/documentation/node_image_manipulation)
* [Image transformations documentation](https://cloudinary.com/documentation/image_transformations)

## License #######################################################################

Released under the MIT license.

