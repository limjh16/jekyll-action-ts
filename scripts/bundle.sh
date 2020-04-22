#!/bin/bash
set -e
bundle config path vendor/bundle
bundle install --jobs 4 --retry 3
exit 0