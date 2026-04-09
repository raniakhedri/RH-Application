import json

data = {
  "type": "service_account",
  "project_id": "antigone-drive-bot",
  "private_key_id": "689e35d6b4389d1c9fa7378147b2e6335883f94d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9uJ/ZiPOk9alC\nlZEE6PgCtriz2sp7EMymgVsyn9jVKtn+ux2uHeFJogRILs1Db7h5Cd2zwH50ycXe\nd6tizg4jpIfoFWVUUtcT0tD/hIO7ACMPil81N1NEjqzEWTrgwETmLiosm7CDaZ92\nNTSPSKevevmroLOdI4w4+0noJSMRKYMDXT7PzefMFoCOyw3PrZ/E4w5sSWkqpXUd\nWcI+UIAdoLyAvx8M5qRZsDoDxN62QKJKWIKtEz8NSWfI2+N3ErWjU2juMsshjG4I\nhE58EHfpgc0bcGIaz4PA3n7uxryypabB23R99IcGWML3Ytzczt4aOpiyYgNGZ83L\nzMEACBjNAgMBAAECggEAUSr4ZKK1jok1mZGQwjeDx/FxsyzzfNRSohfsswt1Qrn7\nGwLl71TESnLg/xra4bOeClbAvcMotwGOQKAVOIfsv64IITBqMjng34/Nr8v7adlk\npqTuF7/sRYP/AWAlkvtfXtU4YO5ZBdf+C542tuiAKVDlGVr/DUckmkpUM9gTmSbb\nSarzMi+Jb1W86QZ7Yp1oTyKPUgr1aOPe97R9Tr60rr09Cfvb5cAYkR9vQ2nNLh5n\nAM1GA6fBsSzkeEqe68vfDq3ikB9++HM4LLrjsIUPzvIvEyiw9zdprYHBMH6ahtNf\nwdKx+t9S9XaaNwcdd9bdQ4XYKuco/QLiNmPCluNYJwKBgQDi2aV49a37z17S5yKE\nyWMtvqiaxs87/yXwQ5kYTf0TQ08xT2aU4lyzpbWyfThokiDzKqj30jHqSLHzfXar\nQ+Y0XkJ+1is/BHPjOo++opH3k30jXOo+ZxfOAIpGrjHsOCKz2c7QkQiQfzt9KKwV\n2tlW77LAwAIhC4ffl4A4cduxdwKBgQDWGZnH82ZaFN/sJ2yZpmR+ruAW7DPdSk9x\n07DCO3yFd/aLRLGjjCMjpxdYfgG2RL2zfHcflW7Bn+VqprdCB4hrylByB8I9A4ZU\nEZ1mdCCSAMlyw1L3sLN/TtqHfezVuX0azddd55GPk5FJBlQE/TepkyBb5B6AqqPS\n20YxTzT42wKBgQCHz83lcRDMpQYcNgzQetFJ3c+LemMvhD3ubkoF5wsQsUeEOgks\nMalWVGtHhPh0gqf/bRbj54/Ct+rx37dgKbJ0v8oHrakOfVf0Pmc4tpO1KTPOLB6B\nZa82wdQHJNr2lVURX+EVtP7vo3y2HdeI7hEYn0DhbRLZPdIG5uj44hGpWQKBgCmM\nQkmJNH2au3GqnOqcXbgv25DXOaFiAFTIje7DeIC2LQQNyqNAWLlcfa1Qlqh2YpHo\nP33DlADDNNQjkkCgEZtJYZ8fXlRU0MaTvIXbV06+FFnPCdTDV7IG7WWJzGIVYu/G\nrlqsy5SfQHx5W+iz8w9XW9o5RKoXcz9CCjcbdd4tAoGBAKYQjOpFcpuIuVZml1k3\n4kvwBc/SUf8M3rkOudc19Qy3apzVOj+En7eqYieuXwqkbuzU9Jc3KPBDR5KFdwbE\nmTFGklQU++g4uTCVpKiY67WBIj2pd4SU8mf6+QhzizQqeqeCIk4UjIsdMQVH50Gp\nMEGdkc5m+r6tlXIGIoJ2quB/\n-----END PRIVATE KEY-----\n",
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
