visit http://localhost:3000/api/docs for swagger api documentation

run 
docker compose build && docker compose up 
to have the system up and running


TO TEST
---------------------------------------------------------
LIST USERS (protected, needs login first)

curl -X GET \
  -H "Authorization: Bearer <token returned by login>

---------------------------------------------------------
REGISTER USER (new user)

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "George",
    "email": "be@smart.you",
    "password": "123abc"
  }'

---------------------------------------------------------
LOGIN USER

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "be@smart.you",
    "password": "123abc"
  }'

