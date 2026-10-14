# Security notes

This is a static concept site with no backend, no accounts, and no data
collection. The edge worker adds a conservative default policy to every
response:

- Content-Security-Policy: default-src 'self'; no external script origins;
  images limited to self and data URIs.
- X-Frame-Options: DENY (the site is never meant to be framed).
- X-Content-Type-Options: nosniff.
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy disables camera, microphone, geolocation, and the
  interest-cohort API.
- Strict-Transport-Security with a one-year max-age.

Common probe paths (/wp-admin, /.env, /.git, phpmyadmin) are answered with a
bare 404 before the asset pipeline runs.

No secrets, credentials, or payment data exist in this repository by design.
The fonts are licensed under the SIL Open Font License via Google Fonts.
