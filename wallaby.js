'use strict';


module.exports = () => {
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

    setup: (wallaby) => {
      const path = require('path');
      require(path.join(wallaby.localProjectDir, 'scripts', 'setup-tests.js'));
    }
  };
};

