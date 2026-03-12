# My Project
A test project with leaked credentials.

## Project Overview
This is our internal service. Database at postgres://admin:supersecret123@prod.db.company.com:5432/main

## Commands
Run: `npm start`
Build: `npm run build`

## API Keys
Use OPENAI_API_KEY=sk-abc123xyz789FAKE or set AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

## Architecture
- Uses JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.FAKESIG
- Private key stored inline: -----BEGIN RSA PRIVATE KEY----- MIIEowIBAAKCAQEA... -----END RSA PRIVATE KEY-----

## Constraints
- Don't expose credentials

## Style
- Follow company guidelines
