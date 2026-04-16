import json

data = {
  "type": "service_account",
  "project_id": "antigone-drive-bot",
  "private_key_id": "87ac5cead0b4fc8d5d3288e4ca71b80190009301",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOL9+584t6cgZY\nL/2G+js4AcPy9Ymyg3fSvQNj4BglItMBYJXXC9DX/PMA+fvrMk1TpMN+YMfnJ1m/\nEHas6dTLBV51YgpIF5Vz3kFtHy4MeO3+Q8vuJdZK/luYpuuoUV91k0n0miCVCk1b\nJbBme0uCbcfckvkztr98R6xFSFm4JHEnedXZSwae8ZtvU4Uga6MyRT+P+4AopafA\nLmmr44uaLhSfN3Az98sX8A63x/qwLngO2HNP7sOG50tr7R6auwiTyhwktlhFFwub\njvLdp71+CAnc0UBgIKeC5MaHfcu83wenxlr1lbuEaytOFmAzckzt+PaUXhBhutAb\nXAbcFsbxAgMBAAECggEAUhPTqznMfa8zYFqmQVuORFLLloVwzYuxIMZWOaVk5y+Q\nMJ2quEK/XaOXdn2M74kEKDZQDhhnq1hKTRk4LMgeibz256Jh9mXQ/CFvCQne8l8X\nWl7RqNkOD6dmfgOAju3poqvBxmmua7YAqjZ8HKebHO4nn+Iv6oqmekorxR6yfG7p\nkZO5gJn4Hmpmb+Cae4TOl58fgGA4P2FfnL4qS8bwnnwGbKwXLR9ywCuxSSBJD4Er\nJBlF/VKbpw6jmliAlvJQc+4NVz3UdynA+Z43PyqG96IubK6A6ZFWcj+ENwa4/8n1\n/ELcIG+YuPwE2js2BReZkjWfCPfnrNnkk4I8kyRz2wKBgQD8l7CgFLPj/tXtvVjq\n2V03X/+dD3GIquIpy+O4cZe2kLrKT2XS1zzmRVaLeGLgqGmPGnX47lgWp330IBKq\nZ70FkQvGWCVDFQGCeoc9bzn8frYWmLJqE9oiuNPb+oJX8hjYkImcle3qCLQkGHCa\nzrpvtpNgYjeRmtXTmDWLsCvHkwKBgQDQ9+0EF7MjgTopy102XimbN7lUsR/mRhg+\nrPNI6e/xEVplbquCI7n/SVbk8zkFXeN4ahlr1neiBKcmY8LV0mV8/Fm2aFy0hcCQ\n0Ex5EIDWoMNSQoHId1dXsGa0XoJ4e4MU5zwcoIzMHWl6xZrbWLOKPdtMT1WGvgww\nZK79jMUB6wKBgQCVfiVPqNEKt/DewniUjc6ojk1XJCO6kgBGYmBE8h2rNB8Iy1Ll\nJPPrCNB+vOIwOhw3UJ7PlChYSAq4aB8D8V+iosSIP/TVreH12hSeXGzCLjAQUZEO\nTO+GK0Nf5vQrnqHr0idPoEBtiXcsAbbrODyJD1JL8fUXXL7+ew/9u2c9twKBgGiZ\nwb2Ls3LxS9EB5/2/8qmsogt/wgz9R0OQRRNZbm7IFeyyEg3Jnl/oMSPXj9Jc5fEv\ngtwU9btXAuhXhX6Mm5qNosaIxObkELksWys6lJNa04qImfhjrIfLWA2vRTXT9ZBw\nEwntX60Ih/UZluN3Kh/nyK8RAym4VdeffmySm0bTAoGACAH5PBr0Sci1BZdK7GD8\nS6TdUDdCNfRx1joMIiqvCXK+Iu9r2MOYq5p2FqjtdjCxWZhw9lQB5q7QPZdbFaS3\neM/hHx0pf82wacFEaVVqvynNKaCMaS4PGR1X+pmffRU9fHPgn51Beu+gvzjdPOkJ\njdJwoKSZV7DA30fLF4/IegQ=\n-----END PRIVATE KEY-----\n",
  "client_email": "antigone-drive-bot@antigone-drive-bot.iam.gserviceaccount.com",
  "client_id": "117246726741897887413",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/antigone-drive-bot%40antigone-drive-bot.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}



with open('service-account.json', 'w') as f:
    json.dump(data, f, indent=2)

print("service-account.json written successfully!")
