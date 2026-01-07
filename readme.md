visit http://localhost:3000/api/docs for documentation
run docker compose build && docker compose up to have the system up and running


the validation pipe performs validations following type enforcement
defined by dto and rto

speficically http requests format are validated in the gateway
business rules are validated in the service


swagger decorators use endpoints defined in the gateway as well
as DTO and RTO to generate comprehensive documentation

utils folder contains code that can be reused across projects, specifically in this
case password hashing and password hash comparison (bcrypt).

caching is implemented via CacheInterceptor at gateway level, auto-capturing 
request-responses pairs and reducing the number of hops between the user and 
data, each 5 seconds for testing purposes

mongose library is used to access mongodb

app guard for throttling and authentication define globally. 
Override with @Public decorator for publicly available endpoints
Override with specific throttling configuration 1 req per second on /users 



to test


users

curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTVlNzgyYTZkOWU4MTMxZjM5ZTBkM2UiLCJlbWFpbCI6ImZhdEBnaXJsLnVrIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNzY3Nzk4ODM5LCJleHAiOjE3Njc4ODUyMzl9.4VH9B5DkFtFK9vovCn1C9IX-UGwuyc8wKupA_RtotWw" \
  http://localhost:3000/auth/users


register

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Giulia",
    "email": "fat@girl.uk",
    "password": "123abc"
  }'

login

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "fat@girl.uk",
    "password": "123abc"
  }'

