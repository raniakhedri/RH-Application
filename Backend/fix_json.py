import json

data = {
  "type": "service_account",
  "project_id": "antigone-drive-bot",
  "private_key_id": "c0212245c8fbc7a3bf84937dd966ee35fa8379d0",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDxyOTCyzrsSSIQ\nb+eSbMnHhQtVWzH26mBSbR0rGv39xRm31BuuAZxtiLWcDickLnbXdK/Ch1rPSu0y\nunuadLzH0jrcgBuJ1EJURUEfwkfSXEw6UVpm3ILuke5JPeb5kAt3oC1wsTNTDF/1\n4qbluiCdJJ5lVWdYoH3wywfn/M5t8LwUZ99KSsC2z8mxunoDimKbT6hwpUWO4/o6\nk7oDH8a1eO4QNPd1xvXQ0uLJoTbWOkHtLlaayUkHQWJMzODYO+wSKGi6tfOeUMuq\ntFG8hAfE39uDiw03MMZjng7V4NVxAkxbZ5qbjp1yRS6iT8I+VHqZodENFyDFyXlV\nJT2DoQjHAgMBAAECggEAadh6XNQ/PUVexjdW9wDs7I1PwtQjcWZ1OGBQDpjIbBmn\nApS2cVx/MGxSpLiFZg95MyT/9HbwyCKS6Ew+5AUKx6c+4VyrsZDcYKvYsKCKdIq3\nTChlHPaX0vzLhgC1ZrcqbfoPKnBIeajHMYtBaPwsXt6zAMV8co3/1DPtiB9h9zo8\nJer6F4wIyqrmzkLB+6NoRhvl/PHs1lGajax/zeg5Rh8u/gTpbN+rXcLqQAeUqCZF\nIQsR3Tf0Wx/6lbY8rD9+B79W43G+tuQgXWG/tktD5RVL1KoTavzmd1PMFE2Tg1b4\nsWwOG0xvxPStkgkA8kPqNRkQaqRUFXa7VQJrI2Bm8QKBgQD61LaHtPzVy4HHPTUC\n1hNPGcVifCh9/RaUC/QEv/mufYH780Q3AK3nLt0q8DWoBupevw3UizppcMkJ5xIk\nwVLy4UQELGCIrZSMOmEZBHbynsJvMSXdrSeYW4YnBL2G1IaPFndDE+5twD55HoVx\n26JBmuIdbCBq2uCQRdv44Sqa/QKBgQD2xHTctZGWIHhzsfNyqLbylaalvpfs2PfP\nqHdvNp7mrNn4y2c31LBVxYrJAjesb70g/J7d9vxhPyouw/v+b7XAyWjAHdPD/GYq\nZx2Vsic5qJgEPqQAryJ9f1+P8VE1XnJQ/pVeFcOHkwGHbiNWsRFfetH/gyeDRc9L\nW4Io3kAoEwKBgQDZ540i2+KCQSdfVRcGfb+MilDlvALZYNMKjk/RCI36PmJ75Nww\nBFEPc7EDqmaSsF9PLB7xtHpsO2ULS0iB0ckj4vrZvUunsVRJdjYAK9bB85XqTwIc\nUF8Dhw9GOmIEDgFPsS6ugVQy2D3trswzG6Eb6VfiQ5rt+XP5Ihd1YPdIaQKBgQD1\nmprlgSGh1jeMjzTKjflogGIY3RXA+kHLQNV+r1KALNHVujzFaL8I31A+uCJJUf1f\nc497RHP1JjUJzq5kkzLG6q+DZyx6CCB3W6Iqd+JqlM6YivAYbjdZyQiH75rwD0yg\nKILp3ad6rGn9LTWm9x1fdpLESPluwnCLhEyL+IjKWQKBgQCelqEL8ojSj+dadvYP\n8hHJmUySXzbSRzlf1gokQ43zXkPr/teEZC0/DBd1zq1woy7TOdzK8eUfHDEhJgo2\nWaupH7UhOIX5pAZkCu0VZ75RrR5xMQSPe2624thYShwoJ1jN7FcSyyrg4jNLliFG\nZd6cQq+GyCRT622dRYEcjwAblQ==\n-----END PRIVATE KEY-----\n",
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
