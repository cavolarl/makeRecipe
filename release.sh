#!/bin/bash
set -e
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py makesuperuser
