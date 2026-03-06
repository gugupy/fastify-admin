SELECT 'CREATE DATABASE fastifyadmin' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fastifyadmin')\gexec
SELECT 'CREATE DATABASE fastifyadmin_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fastifyadmin_test')\gexec
