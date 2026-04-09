import json

data = {
  "type": "service_account",
  "project_id": "antigone-drive-bot",
  "private_key_id": "9a4d24f190cc338559e2f17300e92f91a97ef74f",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtobM2NX4JuUNP\nZMQKmUMdGIrgE91YuPGnQ/iP052q4L5gEC9UbqYy2UVvAu6mRYJAEDlyiDVzfdrp\n/mhQNdviX5kydvi0Dz6sDvPtLpSZxgKinP63thVF3kED7LGisBm/YSwvO4OFKb3K\niQAyP2HfhfwFQwbI16TKIQayiIfeKHaGDq3L4mpPA+0rY+rhHwbHuR7PZPWDQeIn\ntrYE/mv0TcqkPlyPpuWHCgYAjTs6/rwnru/ol4xMZVNPmAMV69A4oeUr34FKFuZc\nIjjluPAY+sGxgRucHgXTCzQAHq5rlsxpFUr8baE1CW8e8zNmpkx41Ziq6URagh9n\nE8dzKxz5AgMBAAECggEAMpwLzxS3eKEaCAXAiLBUmiIBtL/FiGtb8JvE0zNk5R5e\nD0UYbp1T70VaUjnCEw/2n7K68/HU1qWMDiFcCWkxfuHLlySLaHx7EY7INc2afdn0\nAa8OJcE6oSNfwwOWYWvADYMG7HuF4eYhTmwxdPP5lLwKkgQP8bG9dDc9KwPVyoB4\nmjgDLYU6zFt+8cWbHnrB9j7uo3mtfQ2hJJs0n+NojYmxhRxPj6WvSusJ8wnAesaS\nBVkftzvJEGNyzj+uOCyDiTRvHAt8nWbE3Djh/FAcPO2QYfCdDZ+QndtVM3FTh7E8\nJEBxpnK/t/8+wbIfX5gcgJgVnO3QSKKWAjVtsYmTawKBgQDiJVwmVqbxhGoTD+It\nvKqeq95UxbragMEnm3uf3Jh8BKCJ+FIDxTC8+JuQW9bEGzuhAtU+cA9v/SXSJsdP\nWeqLtmDbEaS5A79/cRQe/Yx4rj6A7eR90BmFijLti8KfpOq7/SizpmcLTa+Rs/Pm\nbdHoW9o/7IWgMbnh95YtiPglCwKBgQDEjZxPnuDcXNAYxMyUkYzkTKaINGWy2CqR\njL35jSEYWU2emsIhUrXNazpxnzjhdP6Jhotmx7UCCKf1g6uNylI6sjD0HiXynjId\nqNzElZmKKIPbFL5r5oD7vvH6ceL9bX7pD9eUP5tHRkRP5LXVVbwnQu7ylbJnsWQW\n6MYmpK0AiwKBgHy2ucDy3JIowg7NHaC3gSiMA8qgWNGTW/Ipzt10XCtYqegsp54o\nqx4rxC6yVxhDJHlBBLSwO/M4mhjxBc1++tgdtgBaFItrw7nWdJA6p7MN9K5Jg07W\n6pw4gKl7/9LmsgUGMeIRDJaxOveRVBppye7oaM4D9BVKFwbE8W8fMCnNAoGATEeQ\n9C16osq6UAKASuA5x5gfwRhkp4XQ72+pgqHMyEBQKU9yK7CHsdL9eX8LeiQHbKP0\nkczLaKCnXlbdS0fLpc/lw7e3jnLqjCwukXRlhAK5OVrRk9p/EDRIgKOWLjhCWny1\nc2lD/+M7O65NCyAcxzfot+h0tl1XtLRdwj2CjoUCgYEA13qfqw4XRZi+LzsujAin\nE5TfiJaUMVAH0MFPm8XIjIsBH5YYh8DBDlpbOJhV3qVfZTxLitmfbflUgR5JB5WI\nDXLVL3a1mj0OJWpM3DbecpmZcFz0qYyhqxfAe+majw/2O0m9gGbw5jOYUCCNK0R8\nC4pk3Ao+5jvjqwBkOOm8cfk=\n-----END PRIVATE KEY-----\n",
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
