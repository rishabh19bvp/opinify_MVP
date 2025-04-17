#!/bin/bash

# Build the project
npm run build

# Run the test
tsc && node dist/test/newsTest.js
