# @mprokopowicz/custom-error

[![npm (scoped)](https://img.shields.io/npm/v/@mprokopowicz/custom-error.svg?style=flat-square)]()
[![Build Status](https://img.shields.io/travis/mprokopowicz/custom-error.svg?style=flat-square)](http://travis-ci.org/mprokopowicz/custom-error/)
[![Code Climate](https://img.shields.io/codeclimate/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error)
[![Coverage](https://img.shields.io/codeclimate/coverage/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error/coverage)
[![Issues](https://img.shields.io/codeclimate/issues/github/mprokopowicz/custom-error.svg?style=flat-square)](https://codeclimate.com/github/mprokopowicz/custom-error/issues)
[![dependencies](https://img.shields.io/david/mprokopowicz/custom-error.svg?style=flat-square)]()
[![devDependencies](https://img.shields.io/david/dev/mprokopowicz/custom-error.svg?style=flat-square)]()


## Synopsis

Create custom error types in node.js (exclusive) with meaningful messages and easy inheritance.

`CustomError` **DO NOT** inherits from standard `Error`, but behaves like it, including proper stack traces and proper formatting when used in ```console.log```. [See more below](#whyNot).

## API Reference

### `CustomError.create(<String> type, <String> ...defaultMessage)`

Returns constructor of new error type. This new constructor prototypicaly inherits from CustomError. CustomError can not be invoked with `new` directly.

### `CustomError#causedBy(<Error> causeError)`

Appends `causeError.message` to your error instance message. Stores `causeError` under `CustomError#cause` property. [See example](#causedByExample).

### `CustomError#formatMessage(<String> ...message)`

Used internally to format error message. It can be overloaded to implement custom error message formatting. [See examples](#formatters).

### `CustomError.global(<String> type, <String> ...defaultMessage)`

Creates new error type like `CustomError.create`, but also sets it as global available identifer (using [`global namespace`](https://nodejs.org/api/globals.html#globals_global)). It also checks if type identifier is available and will throw if such name is already taken.

#### But aren't globals bad thing!?

You probably don't want register any globals in libriaries that are supposed to be used by others, but in applications code, you don't want `require` say `InternalError` or simillar error type everywhere.




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

### <a name="causedByExample">Cause errors</a>
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

## <a name="formatters">Custom message formatters</a>

You may sometimes need to apply some advnaced message formatting, eg. create readable error message from array of validation errors. To do so, you should overload `CustomError.formatMessage` method:


```javascript
let validationResults = [{
	path: 'foo.bar',
	keyword: 'required',
	message: 'bar is required',
	input: null
}, {
	path: 'bar.foo',
	keyword: 'min',
	message: 'foo should be greater than 10'
}];

//ES6 way
class ValidationError extends CustomError {
	formatMessage(validationResults) {
		return validationResults
			.map((validationResults) => `${validationResults.path}: ${validationResults.message}`)
			.join(', ');
	}
}

console.log(new ValidationError(validationResults).message);
// 'foo.bar: bar is required, bar.foo: foo should be greater than 10'


//ES5 way
function ValidationError(validationResults) {
	CustomError.call(this, validationResults);
}
ValidationError.prototype = Object.create(CustomError.prototype);
ValidationError.prototype.constructor = ValidationError;

ValidationError.prototype.formatMessage = function(validationResults) {
	return validationResults.map(function(validationResult) {
      return validationResult.path + ': ' + validationResult.message;
    }).join(', ');
};

console.log(new ValidationError(validationResults).message);
// 'foo.bar: bar is required, bar.foo: foo should be greater than 10'
```
## Installation

```
$ npm install --save @mprokopowicz/custom-error
```

```javascript
var CustomError = require('@mprokopowicz/custom-error'); //es5
const  CustomError = require('@mprokopowicz/custom-error'); //es6
```

## <a name="whyNot">Why it does not inherit from `Error`?</a>

Standard `Error` may be throwed under many unpredictable circumstances including typos, undefined references etc. In such cases your program **should crash** as soon as possible and you should fix your bug. By testing if `error` you're about to catch is instance of `CustomError`, not `Error` you can avoid accidently catching and eventually supressing/ignoring generic `Error`, `TypeError` etc.

```javascript
try {
	someObject.doSonethingThatThrows();
} catch (error) {
	if (error instanceof Error) {
		console.log('failed to do something!');
	}
}
```

In given example you may suppose that it is some error throwed by `doSomethingThatThrows`, but there is a typo in there (so**m**ething vs so**n**ething).

## License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
