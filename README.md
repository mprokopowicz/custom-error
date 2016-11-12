# @mprokopowicz/custom-error

[![npm (scoped)](https://img.shields.io/npm/v/@mprokopowicz/custom-error.svg?style=flat-square)]()
[![Build Status](https://img.shields.io/travis/mprokopowicz/custom-error.svg?style=flat-square)](http://travis-ci.org/mprokopowicz/custom-error/)
[![Code Climate](https://img.shields.io/codeclimate/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error)
[![Coverage](https://img.shields.io/codeclimate/coverage/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error/coverage)
[![Issues](https://img.shields.io/codeclimate/issues/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error/issues)
[![dependencies](https://img.shields.io/david/mprokopowicz/custom-error.svg?style=flat-square)]()
[![devDependencies](https://img.shields.io/david/dev/mprokopowicz/custom-error.svg?style=flat-square)]()


## Synopsis

Create custom error types in node.js with meaningful messages and easy inheritance.

## Code Example

### Basic usage

```javascript
const CustomError = require('@mprokopowicz/custom-error');

const MyCustomError = CustomError.create('MyCustomError');

try {
	throw new MyCustomError('Ooops!');
} catch (error) {
	if (error instanceof MyCustomError) {
		//handle the error type you want
	} else {
		//throw, log or whatever any other error types
	}
}
```

### Error messages

You can pass default message to `CustomError.create(type, defaultMessage)` as 2nd argument:

```javascript
const ErrorWithDefaultMessage = CustomError.create('MyCustomError', 'oh my!');
const ErrorWithoutDefaultMessage = CustomError.create('MyCustomError');

new ErrorWithDefaultMessage().message; // 'oh my!'
new ErrorWithDefaultMessage('my message').message; // 'my message'

new ErrorWithoutDefaultMessage().message; // ''
new ErrorWithoutDefaultMessage('custom message').message; // 'custom message'
```

Messages are formated using [util.format](https://nodejs.org/dist/latest-v7.x/docs/api/util.html#util_util_format_format_args):

```javascript
const MyErrorType = CustomError.create('MyErrorType', '%d + %d = %d', 2, 3, 5);
new MyErrorType().message; // '2 + 3 = 5'
new MyErrorType('num=%d, obj=%j', 2, {foo: 'bar'}).message; // 'num=2, obj={"foo":"bar"}'
```

### Cause errors
Every `CustomError` instance has `causedBy(error)` method, that returns self instace. It appends cause error message to your error message and saves cause error under `cause` property of your error:

```javascript
const ReadConfigError = CustomError.create('ReadConfigError', 'failed to read config file');

readConfig('non-existing.json', function(error) {
  console.log(error.message); //failed to read config file << ENOENT: no such file or directory, open 'non-existing.json'
});

readConfig('invalid.json', function(error) {
  console.log(error.message); //failed to read config file << Unexpected end of JSON input
});

function readConfig(configFilePath, callback) {
  fs.readFile(configFilePath, function(readFileError, fileContent) {
    if (readFileError) {
      callback(new ReadConfigError().causedBy(readFileError));
    } else {
      try {
        callback(JSON.parse(fileContent));
      } catch (jsonError) {
        callback(new ReadConfigError().causedBy(jsonError));
      }
    }
  });
}
```

## Inheritance

If you need to be very precise about handling potential errors you can create child error types:

```javascript

const CustomError = require('./lib/custom-error');
const fs = require('fs');

const ReadConfigError = CustomError.create('ReadConfigError', 'failed to read config file');

/* note .create(...) is called below on ReadConfigError, not CustomError */
const ConfigFileNotFoundError = ReadConfigError.create('ConfigFileNotFoundError')
const ConfigFileSyntaxError = ReadConfigError.create('ConfigFileSyntaxError');

new ConfigFileNotFoundError() instanceof ReadConfigError; //true
new ConfigFileSyntaxError() instanceof ReadConfigError; //true

readConfig('config.json', function(error) {
  if (error) {
    if (error instanceof ConfigFileSyntaxError) {
      console.log('Check your config file syntax!');
    } else if (ReadConfigError) {
      console.log('general readConfig error!', error.message);
    } else {
      throw error; //unexpected exception
    }
  }
});

function readConfig(configFilePath, callback) {
  fs.readFile(configFilePath, function(readFileError, fileContent) {
    if (readFileError) {
      callback(new ConfigFileNotFoundError().causedBy(readFileError));
    } else {
      try {
        callback(JSON.parse(fileContent));
      } catch (jsonError) {
        callback(new ConfigFileSyntaxError().causedBy(jsonError));
      }
    }
  });
}

```

## Installation

```
$ npm install --save @mprokopowicz/custom-error
```

```javascript
var CustomError = require('@mprokopowicz/custom-error'); //es5
const  CustomError = require('@mprokopowicz/custom-error'); //es6
```


## License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
