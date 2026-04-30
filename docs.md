backend-stage3/
│
├── server.js
├── config/
│   └── db.js
│
├── models/
│   ├── Profile.js
│   └── User.js        👈 NEW
│
├── routes/
│   ├── profileRoutes.js
│   └── authRoutes.js  👈 NEW
│
├── controllers/
│   ├── profileController.js
│   └── authController.js 👈 NEW
│
├── middleware/
│   ├── authMiddleware.js 👈 NEW
│   ├── roleMiddleware.js 👈 NEW
│   └── errorMiddleware.js 👈 NEW
│
├── utils/
│   └── token.js 👈 NEW
│
└── seed/



insighta-backend/
Contains:

Express API
Auth (JWT + OAuth)
RBAC
Filtering/search (Stage 2)
CSV export
Rate limiting + logging

👉 This is your main brain



CLI Tool
insighta-cli/

Contains:

Node CLI (commander / yargs)
GitHub OAuth (PKCE)
Token storage:
~/.insighta/credentials.json
Commands like:
insighta login
insighta profiles --country NG

👉 This tests developer-facing interface


insighta-web/

Contains:

Frontend (React / Next.js recommended)
GitHub login
HTTP-only cookies
CSRF protection
UI for profiles

👉 This tests user-facing interface

How They Connect
CLI -----------\
                \
                 ---> BACKEND API ---> MongoDB
                /
WEB -----------/

✅ 
Final README (this one is heavily graded)
✅ 
Mock interview prep for this project



send these first:

controllers/authController.js
routes/authRoutes.js
utils/token.js
middleware/authMiddleware.js
middleware/roleMiddleware.js

then
controllers/profileController.js
routes/profileRoutes.js

then 
models/Profile.js
models/User.js

then 
middleware/errorMiddleware.js
Rate limiting setup (if in server.js)
Logging setup (morgan / winston)

then 
5. Server Entry
server.js

then
6. Seed Script
seed/user.js


cookies in production
secure: true
sameSite: "none"