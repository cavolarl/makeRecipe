#!/bin/bash
set -e
gunicorn makeRecipe.wsgi --bind 0.0.0.0:8000 --log-file -
