
export const ResponseMessages = {
    AUTH: {
      SERVICE_UNAVAILABLE: 'Auth service unavailable',
      REGISTRATION_FAILED: 'Registration failed',
      LOGIN_FAILED: 'Login failed',
      INVALID_CREDENTIALS: 'Invalid credentials',
      USER_ALREADY_EXISTS: 'User with this email already exists',
      USERS_RETRIEVED: 'List of users retrieved successfully',
      USER_REGISTERED: 'User registered successfully',
      LOGIN_SUCCESSFUL: 'Login successful',
      USER_NOT_FOUND: 'User not found',
      USER_CREATED: 'User created successfully',
      USERS_FETCHED: 'Users fetched successfully',
    },
    CACHE: {
      MISS: 'CACHE MISS',
      HIT: 'CACHE HIT',
    },
  } as const;
  
  export const ResponseErrors = {
    BAD_REQUEST: 'Bad Request',
    UNAUTHORIZED: 'Unauthorized',
    SERVICE_UNAVAILABLE: 'Service Unavailable',
  } as const;