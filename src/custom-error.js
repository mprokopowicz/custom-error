const format = require('util').format;
const vm = require('vm');

class CustomError extends Error {
  constructor(...message) {
    super();
    if (this.constructor === CustomError) {
      throw new Error('new called on CustomError, create custom Error type instead!');
    }
    this.message = message.length ? format(...message) : this.defaultMessage;
  }

  causedBy(causeError) {
    if ('message' in causeError && typeof causeError.message === 'string' && causeError.message.length) {
      if (!this.message) {
        this.message = causeError.message;
      } else {
        this.message = `${this.message} ${this.glue} ${causeError.message}`;
      }
    } else {
      //do not modify empty message if cause error does not have message too
    }

    this.cause = causeError;
    return this;
  }

  static create(type, ...defaultMessage) {
    const NewCustomError = class extends this {};
    NewCustomError.prototype.name = type;
    if (defaultMessage.length) {
      NewCustomError.prototype.defaultMessage = format(...defaultMessage);
    }

    return NewCustomError;
  }

  static global(type, ...defaultMessage) {
    if (vm.runInThisContext(`typeof ${type}`) !== 'undefined') {
      throw new Error(`can not create global error type "${type}"; there is already such global`);
    }
    global[type] = CustomError.create(type, ...defaultMessage);
  }
}
CustomError.prototype.name = 'CustomError';
CustomError.prototype.glue = '<<';
CustomError.prototype.defaultMessage = '';

module.exports = CustomError;
