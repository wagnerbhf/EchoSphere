# EchoSphere — Chat Backend (Test)

Quick overview
- .NET 10 project using SignalR with a simple JWT-based authentication flow.
- Includes a SignalR hub (EchoSphereHub) and a test client page under wwwroot/test-chat.html.

Requirements
- .NET 10 SDK
- Visual Studio 2022/2026 or VS Code

Run locally
1. Open the solution EchoSphere.slnx in Visual Studio or run from the terminal:
   cd EchoSphere
   dotnet run
2. Open the test page in your browser while the app is running:
   https://localhost:7147/test-chat.html

Useful endpoints
- POST /api/auth/login
  - Request body: { "username": "YourName" }
  - Response: { token, userId, username }
  - The returned token can be used by the client to connect to the SignalR hub (the test client uses accessTokenFactory).

Example (PowerShell curl):
```powershell
curl -Method POST -Uri https://localhost:7147/api/auth/login -Body (ConvertTo-Json @{ username = "Wagner" }) -ContentType 'application/json'
```

SignalR
- Hub URL: /echosphereHub
- Client events handled by the test page: ReceiveMessage, ReceivePrivateMessage, UserConnected, UserJoined, UserDisconnected
- Hub methods invoked by the client: JoinRoom, SendMessage, SendPrivateMessage

Testing the app
- Use the test page to obtain a token (Get Token), connect to the hub, join a room and send messages.
- Open multiple browser windows or incognito sessions to simulate multiple users.

JWT configuration
- JWT settings are in appsettings.json and appsettings.Development.json under the JwtSettings section.
- Do not store production secrets in appsettings.json. Use user-secrets, environment variables, or a secret store such as Azure Key Vault.

Suggested improvements
- Persist users and messages (EF Core or a NoSQL store) so you have chat history.
- Add a backplane (Redis) to scale SignalR across multiple instances.
- Replace localStorage token storage with HttpOnly cookies and a refresh-token flow for improved security.
- Use IOptions<JwtSettings> for a more idiomatic configuration approach in ASP.NET Core.

Notes
- The test client files were split into HTML, CSS and JS under wwwroot.
- The current AuthController issues a random userId per login (no persistent user accounts yet).