# Wiedervorlage - Your Personal Email Reminder Assistant

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Never forget important things again! This is my personal email-based reminder service that lets you schedule reminders by sending emails to special addresses. It's simple, effective, and has been super helpful for me.

## Cool Features

- Monitors your email inbox for new reminders
- Works with plus addressing supported by Gmail, Outlook, Yahoo, iCloud, and many others
- Works with special addresses in To, CC, or BCC fields
- Handles different time formats:
  - Seconds: `remind+30s@yourdomain.com`
  - Minutes: `remind+15m@yourdomain.com`
  - Hours: `remind+1h@yourdomain.com`
  - Days: `remind+7d@yourdomain.com`
  - Weeks: `remind+2w@yourdomain.com`
- Sends you a confirmation when it sets up your reminder
- Keeps your reminders safe in a local file
- Runs quietly in the background (and if it doesn't it sends you an email via BetterStack heartbeats; optional)
- Speaks multiple languages (English, German, French)
- Lets you add your own translations if needed

## What's Inside
- [Getting Started](#getting-started)
- [How to Use It](#how-to-use-it)
- [Setting Things Up](#setting-things-up)
- [License](#license)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/mariusangelmann/Wiedervorlage.git
cd Wiedervorlage
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the `.env.example` template.

## How to Use It

To start the development server:
```bash
npm run dev
```

To build and run the production version:
```bash
npm run build
npm start
```

## Setting Things Up

### Password Authentication (Default)

For traditional password authentication, configure these in your `.env` file:

```env
IMAP_SERVER=imap.example.com
SMTP_SERVER=smtp.example.com
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-password
BASE_DOMAIN=example.com
```

### OAuth2 Authentication

For OAuth2 authentication (Gmail, Outlook, Yahoo), you'll need:

1. **Set up OAuth2 credentials** with your email provider (see [detailed provider configurations](#email-provider-configuration) below)

2. **Configure OAuth2 in your `.env` file**:

```env
# Basic configuration
IMAP_SERVER=imap.gmail.com
SMTP_SERVER=smtp.gmail.com
EMAIL_USERNAME=your-email@gmail.com
BASE_DOMAIN=yourdomain.com
AUTH_METHOD=oauth2

# OAuth2 credentials
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_REFRESH_TOKEN=your-refresh-token
OAUTH2_PROVIDER=google  # or microsoft, yahoo

# Optional: if you already have an access token
OAUTH2_ACCESS_TOKEN=your-access-token
```

### Email Provider Configuration

#### Gmail / Google Workspace

**Server Settings:**
```env
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587  # or 465 for SSL
```

**Setup Guides:**
- [Enable IMAP in Gmail](https://support.google.com/mail/answer/7126229)
- [Create App Password (for password auth)](https://support.google.com/accounts/answer/185833)
- [Set up OAuth2 for Gmail](https://developers.google.com/gmail/api/quickstart/python)
- [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)

**OAuth2 Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth2 credentials (Desktop application type)
5. Use scopes: `https://mail.google.com/`
6. Use OAuth2 Playground to get refresh token

#### Microsoft 365 / Outlook.com

**Server Settings:**
```env
IMAP_SERVER=outlook.office365.com
IMAP_PORT=993
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
```

**Setup Guides:**
- [Enable IMAP in Outlook.com](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [Create App Password (for password auth)](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944)
- [Register OAuth2 App](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)

**OAuth2 Setup:**
1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Add permissions: `IMAP.AccessAsUser.All`, `SMTP.Send`
4. Create client secret
5. Use authorization code flow to get tokens

#### Yahoo Mail

**Server Settings:**
```env
IMAP_SERVER=imap.mail.yahoo.com
IMAP_PORT=993
SMTP_SERVER=smtp.mail.yahoo.com
SMTP_PORT=587  # or 465 for SSL
```

**Setup Guides:**
- [Yahoo IMAP Settings](https://help.yahoo.com/kb/SLN4724.html)
- [Generate App Password](https://help.yahoo.com/kb/SLN15241.html)
- [Yahoo Developer Apps](https://developer.yahoo.com/apps/)

**OAuth2 Setup:**
1. Go to [Yahoo Developer Dashboard](https://developer.yahoo.com/apps/)
2. Create a new app
3. Get OAuth2 credentials
4. Use authorization flow to get refresh token

#### iCloud Mail

**Server Settings:**
```env
IMAP_SERVER=imap.mail.me.com
IMAP_PORT=993
SMTP_SERVER=smtp.mail.me.com
SMTP_PORT=587
```

**Setup Guides:**
- [iCloud Mail server settings](https://support.apple.com/en-us/102525)
- [Generate app-specific password](https://support.apple.com/en-us/102654)
- [Using iCloud+ Custom Email Domain](https://support.apple.com/en-us/102540)

**Note:** iCloud requires app-specific passwords when 2FA is enabled. OAuth2 is not supported.

#### ProtonMail

**Server Settings (via ProtonMail Bridge):**
```env
IMAP_SERVER=127.0.0.1
IMAP_PORT=1143
SMTP_SERVER=127.0.0.1
SMTP_PORT=1025
```

**Setup Guides:**
- [ProtonMail Bridge Setup](https://proton.me/mail/bridge)
- [Bridge Configuration Guide](https://proton.me/support/protonmail-bridge-install)
- [IMAP/SMTP Settings](https://proton.me/support/protonmail-bridge-clients)

**Note:** ProtonMail requires the Bridge application running locally. Use the credentials provided by Bridge.

#### FastMail

**Server Settings:**
```env
IMAP_SERVER=imap.fastmail.com
IMAP_PORT=993
SMTP_SERVER=smtp.fastmail.com
SMTP_PORT=587  # or 465 for SSL
```

**Setup Guides:**
- [FastMail Server Settings](https://www.fastmail.help/hc/en-us/articles/1500000278342)
- [App Passwords](https://www.fastmail.help/hc/en-us/articles/360058752854)
- [Plus Addressing Guide](https://www.fastmail.help/hc/en-us/articles/360060591053)

**Note:** FastMail recommends using app-specific passwords for third-party apps.

### Optional language settings
```env
LANGUAGE=en # or 'de' for German / 'fr' for French
CUSTOM_TRANSLATIONS_PATH=path/to/custom-translations.json # optional
```

## Usage

1. Compile service:
```bash
npm run build
```

2. Start service:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Here's How It Works

The reminder address can be used in any recipient field (To, CC, or BCC), making it super flexible for different situations.

1. Send an email to a special reminder address:
   - remind+1h@yourdomain.com (reminder in 1 hour)
   - remind+2d@yourdomain.com (reminder in 2 days)
   - remind+1w@yourdomain.com (reminder in 1 week)

2. You'll receive a confirmation email with the planned delivery time.

3. At the specified time, you'll receive your original email back as a reminder.

## Here's What You Can Configure

| Variable | Description | Default |
|----------|-------------|---------|
| IMAP_SERVER | IMAP server address | - |
| IMAP_PORT | IMAP port | 993 |
| SMTP_SERVER | SMTP server address | - |
| SMTP_PORT | SMTP port | 587 |
| EMAIL_USERNAME | Email address | - |
| EMAIL_PASSWORD | Email password (for password auth) | - |
| BASE_DOMAIN | Domain for reminder addresses | - |
| AUTH_METHOD | Authentication method (password/oauth2) | password |
| CHECK_INTERVAL | Check interval in seconds | 60 |
| DEBUG_MODE | Enable debug mode | false |
| MAX_RETRIES | Maximum connection attempts | 3 |
| REMINDERS_FILE | Path to reminders file | reminders.json |
| LANGUAGE | Interface language (en/fr) | en |
| CUSTOM_TRANSLATIONS_PATH | Path to custom translations | - |
| HEARTBEAT_ENABLED | Enable BetterStack monitoring | false |
| HEARTBEAT_URL | BetterStack heartbeat URL | - |
| HEARTBEAT_INTERVAL | Heartbeat interval in seconds | Same as CHECK_INTERVAL |

### OAuth2 Configuration (when AUTH_METHOD=oauth2)

| Variable | Description | Default |
|----------|-------------|---------|
| OAUTH2_CLIENT_ID | OAuth2 client ID | - |
| OAUTH2_CLIENT_SECRET | OAuth2 client secret | - |
| OAUTH2_REFRESH_TOKEN | OAuth2 refresh token | - |
| OAUTH2_ACCESS_TOKEN | OAuth2 access token (optional) | - |
| OAUTH2_ACCESS_URL | OAuth2 token endpoint (optional) | - |
| OAUTH2_PROVIDER | Provider (google/microsoft/yahoo/custom) | - |

## Want It in Another Language?

You can provide your own translations by creating a JSON file with the following structure (this example is for French):

```json
{
  "language": "fr",
  "translations": {
    "timeUnits": {
      "seconds": "secondes",
      "minutes": "minutes",
      "hours": "heures",
      "days": "jours",
      "weeks": "semaines"
    },
    "emails": {
      "confirmationSubject": "Rappel créé",
      "confirmationBody": "Votre rappel a été créé et sera livré dans {timeStr}.\nLivraison prévue: {deliveryTime}",
      "reminderSubject": "RAPPEL: {subject}",
      "reminderBody": "Voici votre rappel demandé (Intervalle: {interval}).\n\nRappel créé le: {createdTime}\n\nMessage d'origine:\n{separator}\n{body}",
      "unknownInterval": "Intervalle inconnu"
    },
    "console": {
      "serviceStart": "Démarrage du service de rappel avec intervalle de vérification de {interval}s",
      "debugMode": "Mode debug: {enabled}",
      "mainLoopError": "Erreur dans la boucle principale:",
      "heartbeatEnabled": "Surveillance BetterStack activée (URL: {url}, Intervalle: {interval}s)"
    }
  }
}
```

## What You'll Need

### Quick Email Provider Reference

| Provider | IMAP Server | SMTP Server | Auth Methods | Setup Guide |
|----------|-------------|-------------|--------------|-------------|
| Gmail | imap.gmail.com | smtp.gmail.com | Password, OAuth2 | [Setup](#gmail--google-workspace) |
| Outlook | outlook.office365.com | smtp-mail.outlook.com | Password, OAuth2 | [Setup](#microsoft-365--outlookcom) |
| Yahoo | imap.mail.yahoo.com | smtp.mail.yahoo.com | Password, OAuth2 | [Setup](#yahoo-mail) |
| iCloud | imap.mail.me.com | smtp.mail.me.com | App Password | [Setup](#icloud-mail) |
| ProtonMail | 127.0.0.1:1143 | 127.0.0.1:1025 | Bridge Password | [Setup](#protonmail) |
| FastMail | imap.fastmail.com | smtp.fastmail.com | App Password | [Setup](#fastmail) |

### Email Service Compatibility

**Services with Full Plus Addressing Support (remind+ANYTHING@yourdomain.com):**

✅ **Gmail/Google Workspace**
- Built-in plus addressing support since 2008
- Works with OAuth2 authentication
- No configuration needed - enabled by default

✅ **Microsoft 365/Outlook.com**
- Plus addressing enabled by default (since April 2022)
- Works with OAuth2 authentication
- Can be disabled by admins if needed

✅ **Yahoo Mail**
- Full plus addressing support
- Works with OAuth2 authentication
- Also offers "disposable email addresses" as an alternative

✅ **iCloud Mail**
- Supports plus addressing for all @icloud.com addresses
- Works with custom domains in iCloud+
- Automatic folder filtering based on plus tag

✅ **ProtonMail**
- Unlimited plus aliases supported
- Works with ProtonMail Bridge for IMAP/SMTP
- Can reply from plus addresses

✅ **FastMail**
- Plus addressing enabled by default
- Advanced features: automatic folder filing based on plus tag
- Also supports subdomain addressing

✅ **Self-Hosted Email Servers**
- Postfix, Dovecot, and most modern mail servers support plus addressing
- May require configuration (check your server's documentation)

**Important Notes:**
1. Plus addressing (user+tag@domain.com) is an email standard that most modern providers support
2. The reminder service requires your email provider to deliver emails sent to `remind+ANYTHING@yourdomain.com` to your main inbox
3. Some websites may reject email addresses containing '+' characters during registration - this is a limitation of those websites, not the email service

### Technical Requirements

- Node.js 14 or higher
- Email server with IMAP and SMTP access
- Own domain for reminder addresses

## When Things Go Wrong

The service is pretty resilient:

The service:
- Automatically attempts to restore connection on errors
- Waits 1 minute before retrying on errors
- Logs errors for diagnosis
- Stores reminders locally to prevent loss on restart
- Reports service health via BetterStack heartbeat monitoring (if enabled)

## Keeping an Eye on Things

The service supports optional BetterStack heartbeat monitoring to track its operational status:

1. Sign up for a BetterStack account and create a new heartbeat monitor
2. Configure the monitoring in your .env file:
   ```env
   HEARTBEAT_ENABLED=true
   HEARTBEAT_URL=https://uptime.betterstack.com/api/v1/heartbeat/YOUR_HEARTBEAT_ID
   # Optional: custom interval (defaults to CHECK_INTERVAL)
   # HEARTBEAT_INTERVAL=60
   ```

The heartbeat monitor reflects the actual health of the service:
- Sends heartbeat only when email operations are successful
- Automatically stops heartbeat on connection issues or errors
- Resumes heartbeat when service recovers
- Helps identify problems with email server connectivity
- Monitors successful reminder processing

## The Legal Stuff

Apache 2.0 - see the [LICENSE](LICENSE) file for details.
