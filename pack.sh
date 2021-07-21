#!/bin/bash
rm du-map.zip
zip -r du-map.zip ./* -x "*.sh" -x "README.md" -x ".*" -x "config.php" -x "TODO" -x "*.php" -x "config.php.example" -x "*.bak"

