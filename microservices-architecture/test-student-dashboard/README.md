## Student Test Server

Minimal server to test student side and LISA integration.

### Run locally
```bash
npm install
LISA_URL=http://localhost:5001 npm run start
# Health
curl http://localhost:3010/health
# Root serves AMSS Student View: http://localhost:3010/
# Minimal test page: http://localhost:3010/test/
```

### Start LISA locally
```bash
cd ../../../AMSS/LISA
./venv/bin/python LISA2.py
# Now listening on http://localhost:5001/lisa_prompt
```


