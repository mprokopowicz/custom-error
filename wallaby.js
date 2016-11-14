'use strict';


module.exports = (wallaby) => {
  const SOURCES = 'src/**/*.js';
  const TESTS = 'src/**/*.test.js';

  return {
    files: [
      SOURCES,
      `!${TESTS}`,
      {pattern: 'scripts/*', instrument: false}
    ],
    tests: [TESTS],

    env: {
      type: 'node',
      runner: 'node'
    },

    compilers: {
      [SOURCES]: wallaby.compilers.babel({})
    },

    setup: (wallaby) => {
      const path = require('path');
      require(path.join(wallaby.localProjectDir, 'scripts', 'setup-tests.js'));
    }
  };
};

