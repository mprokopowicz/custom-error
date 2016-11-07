'use strict';

describe('CustomError', () => {
  const util = require('util');
  const CustomError = require('./custom-error');

  describe('constructor', () => {
    let MyCustomError;
    beforeEach(() => MyCustomError = CustomError.create('MyCustomError', 'default message'));

    it('should not allow to create direct instances of CustomError', () => {
      expect(() => new CustomError()).to.throw(Error);
    });

    it('should set default message', () => {
      expect(new MyCustomError()).to.have.property('message', 'default message');
    });

    it('should set passed message', () => {
      expect(new MyCustomError('my message')).to.have.property('message', 'my message');
    });

    it('should format passed message using util.format', () => {
      let messageArguments = ['string=%s, num=%d, obj=%j', 'string', 123, {a: 1}];
      expect(new MyCustomError(...messageArguments)).to.have.property('message', util.format(...messageArguments));
    });
  });

  describe('causedBy', () => {
    let MyCustomError;
    beforeEach(() => MyCustomError = CustomError.create('MyCustomError'));
    it('should set message to cause error message', () => {
      expect(new MyCustomError().causedBy(new Error('culprit'))).to.have.property('message', 'culprit');
    });

    it('should append cause error message to error message', () => {
      const error = new MyCustomError('oops!').causedBy(new Error('culprit'));
      expect(error).to.have.property('message', 'oops! << culprit');
    });

    it('should not modify empty message', () => {
      const causeError = new Error();
      const myError = new MyCustomError().causedBy(causeError);
      expect(myError).to.have.property('message', '');
    });

    it('should return instance of self for chaining', () => {
      const causeError = new Error();
      const myError = new MyCustomError();
      expect(myError.causedBy(causeError)).to.equal(myError)
    });

    it('should store cause error under "cause" property', () => {
      const causeErrorWithoutMessage = new Error();
      const causeErrorWithMessage = new Error('culprit');
      const customErrorWithoutMessage = new MyCustomError();
      const customErrorWithMessage = new MyCustomError('oops');

      expect(customErrorWithoutMessage.causedBy(causeErrorWithoutMessage).cause).to.equal(causeErrorWithoutMessage);
      expect(customErrorWithoutMessage.causedBy(causeErrorWithMessage).cause).to.equal(causeErrorWithMessage);
      expect(customErrorWithMessage.causedBy(causeErrorWithoutMessage).cause).to.equal(causeErrorWithoutMessage);
      expect(customErrorWithMessage.causedBy(causeErrorWithMessage).cause).to.equal(causeErrorWithMessage);
    });
  });

  describe('create', () => {
    it('should return constructor of new error type', () => {
      const MyCustomError = CustomError.create('CustomError');

      expect(MyCustomError).to.be.an('Function');
      expect(Error.isPrototypeOf(MyCustomError)).to.be.ok;
      expect(CustomError.isPrototypeOf(MyCustomError)).to.be.ok;
      expect(() => new MyCustomError()).not.to.throw();
      expect(new MyCustomError()).to.be.instanceOf(Error);
      expect(new MyCustomError()).to.be.instanceOf(CustomError);
    });

    it('should allow to create child error types', () => {
      const MyParentError = CustomError.create('MyParentError');
      const MyChildError = MyParentError.create('MyChildError');

      expect(Error.isPrototypeOf(MyChildError)).to.be.ok;
      expect(CustomError.isPrototypeOf(MyChildError)).to.be.ok;
      expect(MyParentError.isPrototypeOf(MyChildError)).to.be.ok;
      expect(new MyChildError()).to.be.instanceOf(Error);
      expect(new MyChildError()).to.be.instanceOf(CustomError);
      expect(new MyChildError()).to.be.instanceOf(MyParentError);
      expect(new MyChildError()).to.be.instanceOf(MyChildError);
    });

    it('should set default message', function() {
      const ErrorWithDefaultMessage = CustomError.create('MyError', 'some message');
      expect(new ErrorWithDefaultMessage()).to.have.property('message', 'some message');
    });

    it('should set default message using util.format', function() {
      const defaultMesesageArguments = ['num=%d, json=%j', 999, {foo: 'bar', enabled: true}];
      const ErrorWithDefaultMessage = CustomError.create('MyError', ...defaultMesesageArguments);
      expect(new ErrorWithDefaultMessage()).to.have.property('message', util.format(...defaultMesesageArguments));
    });
  });

  describe('global', () => {
    afterEach(() => delete global['GlobalError']);

    it('should throw Error if global name is already taken', () => {
      expect(() => CustomError.global('Error')).to.throw(/can not create global error type "Error"/);
      expect(() => CustomError.global('TypeError')).to.throw(/can not create global error type "TypeError"/);
      expect(() => CustomError.global('RangeError')).to.throw(/can not create global error type "RangeError"/);
      expect(() => CustomError.global('Buffer')).to.throw(/can not create global error type "Buffer"/);
      expect(() => CustomError.global('GlobalError')).not.to.throw();
    });

    it('should expose new error type constructor as global', () => {
      CustomError.global('GlobalError', 'Global error!');

      expect(GlobalError).not.to.be.undefined;
      expect(CustomError.isPrototypeOf(GlobalError)).to.be.ok;
    });
  });

  describe('toString', () => {
    const ParentError = CustomError.create('ParentError', 'parent default');
    const ChildError = ParentError.create('ChildError', 'child default');

    it('should have error type, semicolon and message', () => {
      expect(new ParentError().toString())
        .to.match(/^ParentError: parent default$/);

      expect(new ParentError('parent custom').toString())
        .to.match(/^ParentError: parent custom$/);

      expect(new ChildError().toString())
        .to.match(/^ChildError: child default/);

      expect(new ChildError('child custom').toString())
        .to.match(/^ChildError: child custom$/);
    });
  });
});
