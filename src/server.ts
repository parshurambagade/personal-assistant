import express from "express";
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL,
);

app.get("/auth", (req, res) => {
  // generate a url that asks permissions for Blogger and Google Calendar scopes
  const scopes = ["https://www.googleapis.com/auth/calendar"];

  const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: "offline",
    // prompt: "concent",
    // If you only need one scope, you can pass it as a string
    scope: scopes,
  });

  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
  console.log(tokens);
  res.send("Connected ✅ You can close this tab now!");
});

app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});
