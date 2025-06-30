# 📧 Wiedervorlage - Email Reminders Made Simple

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Turn any email into a reminder by BCCing yourself!** Just add `yourname+2d@gmail.com` to get reminded in 2 days. No apps, no complexity - just email.

---

## ✨ Why You'll Love This

Imagine you're emailing a client and want to follow up in 3 days. Just BCC `yourname+3d@gmail.com` and you're done! The service will:

1. **Confirm immediately** - "✅ Reminder set for 3 days"
2. **Remind you on time** - Original email delivered back to your inbox
3. **Work with any email** - Gmail, Outlook, Yahoo, iCloud, and more

## 🚀 Key Features

- **📬 Works with your existing email** - No custom domain needed (Gmail, Outlook, etc.)
- **⏰ Flexible timing** - Minutes, hours, days, or weeks (`+30m`, `+1h`, `+7d`, `+2w`)
- **🌍 Multi-language** - 13 languages supported (English, German, French, Spanish, Italian, Portuguese, Dutch, Japanese, Chinese, Hindi, Arabic, Ukrainian, Korean) + add your own
- **🔒 Privacy-first** - Runs on your own server, your emails stay private
- **💪 Reliable** - Saves reminders locally, optional monitoring with BetterStack
- **🎯 Smart** - Processes all emails (even if marked as read), tracks processed messages
- **🧹 Clean inbox** - Automatically moves processed reminder emails to trash

---

## 🎯 Quick Start (5 minutes)

### Using Gmail? Here's the fastest setup:

1. **Clone & Install**
   ```bash
   git clone https://github.com/mariusangelmann/Wiedervorlage.git
   cd Wiedervorlage
   npm install
   ```

2. **Get Gmail App Password**
   - Enable 2FA: https://myaccount.google.com/signinoptions/two-step-verification
   - Generate password: https://myaccount.google.com/apppasswords
   - Choose "Mail" → Copy the 16-character password

3. **Configure** (create `.env` file)
   ```bash
   # Gmail users: just copy the template!
   cp .env.gmail .env
   # Then edit .env with your email and app password
   ```
   
   Or manually create `.env`:
   ```env
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your app password
   IMAP_SERVER=imap.gmail.com
   SMTP_SERVER=smtp.gmail.com
   BASE_DOMAIN=gmail.com
   ```

4. **Run**
   ```bash
   npm run build
   npm start
   ```

5. **Test** - Send yourself an email and BCC `your-email+1h@gmail.com`

> **Other providers?** Check the [full setup guide](#setting-things-up) below.

---

## 📖 How It Works

### 💡 The Smart Way (Works with Gmail, Outlook, etc.)

**No custom domain needed!** If you use Gmail, Outlook, or any provider with plus addressing:

1. **Just BCC yourself with a plus address:**
   ```
   To: colleague@company.com
   BCC: youremail+3d@gmail.com
   ```

2. **The service processes it and sends you:**
   - ✅ Immediate confirmation that your reminder is set
   - ⏰ Your original email back in 3 days
   - 🗑️ Moves the activation email to trash (keeps inbox clean!)

**That's it!** No need to set up a custom domain - use your existing email's plus addressing!

### 🎯 Examples for Different Providers

**Gmail users:**
```
BCC: yourname+1h@gmail.com     → Reminder in 1 hour
BCC: yourname+2d@gmail.com     → Reminder in 2 days  
BCC: yourname+1w@gmail.com     → Reminder in 1 week
```

**Outlook users:**
```
BCC: yourname+30m@outlook.com  → Reminder in 30 minutes
BCC: yourname+7d@outlook.com   → Reminder in 7 days
```

### 📧 How the Service Works

1. **You send an email** and include a reminder address (To, CC, or BCC)
2. **Service catches it** when checking your inbox (reads all emails, not just unread!)
3. **Saves the reminder** and sends you a confirmation
4. **Delivers the reminder** at the specified time

### ⏱️ Time Formats

- **Seconds**: `+30s` (30 seconds)
- **Minutes**: `+15m` (15 minutes)  
- **Hours**: `+1h` (1 hour)
- **Days**: `+7d` (7 days)
- **Weeks**: `+2w` (2 weeks)

---

## ⚙️ Setting Things Up

### Password Authentication (Default)

For traditional password authentication, configure these in your `.env` file:

**Example with Gmail (using app password):**
```env
IMAP_SERVER=imap.gmail.com
SMTP_SERVER=smtp.gmail.com
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your 16-character app password
BASE_DOMAIN=yourdomain.com
AUTH_METHOD=password  # This is the default
```

**Example with other providers:**
```env
IMAP_SERVER=imap.example.com
SMTP_SERVER=smtp.example.com
EMAIL_USERNAME=your-email@example.com
EMAIL_PASSWORD=your-password
BASE_DOMAIN=example.com
```

**Note:** Gmail, Outlook, and Yahoo require app passwords when 2FA is enabled. See the [provider configuration](#email-provider-configuration) section below for details.

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

**🔐 Recommended: App Password Method (Simple & Quick)**

Gmail requires either an app password or OAuth2. **App passwords are much easier to set up:**

1. **Enable 2-Factor Authentication** (required for app passwords)
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "2-Step Verification" and follow the setup

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select your device type
   - Copy the generated 16-character password

3. **Configure your .env file:**
   ```env
   EMAIL_USERNAME=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password  # Use app password here!
   AUTH_METHOD=password  # Keep as password, not oauth2
   ```

**Important:** Use the app password instead of your regular Gmail password!

**Alternative: OAuth2 Method (Advanced)**
- [Set up OAuth2 Guide](https://developers.google.com/gmail/api/quickstart/python)
- [Google OAuth2 Playground](https://developers.google.com/oauthplayground/)
- Requires Google Cloud Console setup and is more complex

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
# Supported languages: en, de, fr, es, it, pt, nl, ja, zh, hi, ar, uk, ko
LANGUAGE=en # Default is English
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

## How It Works

### 💡 The Smart Way (Works with Gmail, Outlook, etc.)

**No custom domain needed!** If you use Gmail, Outlook, or any provider with plus addressing:

1. **Just BCC yourself with a plus address:**
   ```
   To: colleague@company.com
   BCC: youremail+3d@gmail.com
   ```

2. **The service processes it and sends you:**
   - ✅ Immediate confirmation that your reminder is set
   - ⏰ Your original email back in 3 days
   - 🗑️ Moves the activation email to trash (keeps inbox clean!)

**That's it!** No need to set up a custom domain - use your existing email's plus addressing!

### 🎯 Examples for Different Providers

**Gmail users:**
```
BCC: yourname+1h@gmail.com     → Reminder in 1 hour
BCC: yourname+2d@gmail.com     → Reminder in 2 days  
BCC: yourname+1w@gmail.com     → Reminder in 1 week
```

**Outlook users:**
```
BCC: yourname+30m@outlook.com  → Reminder in 30 minutes
BCC: yourname+7d@outlook.com   → Reminder in 7 days
```

### 📧 How the Service Works

1. **You send an email** and include a reminder address (To, CC, or BCC)
2. **Service catches it** when checking your inbox (reads all emails, not just unread!)
3. **Saves the reminder** and sends you a confirmation
4. **Delivers the reminder** at the specified time

### ⏱️ Time Formats

- **Seconds**: `+30s` (30 seconds)
- **Minutes**: `+15m` (15 minutes)  
- **Hours**: `+1h` (1 hour)
- **Days**: `+7d` (7 days)
- **Weeks**: `+2w` (2 weeks)

## 🔧 Configuration Options

### Essential Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_USERNAME` | Your email address | Required |
| `EMAIL_PASSWORD` | App password (not regular password!) | Required |
| `IMAP_SERVER` | IMAP server (e.g., imap.gmail.com) | Required |
| `SMTP_SERVER` | SMTP server (e.g., smtp.gmail.com) | Required |
| `BASE_DOMAIN` | Domain for reminders | Required |

### Optional Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `CHECK_INTERVAL` | How often to check (seconds) | 60 |
| `SEARCH_DAYS_BACK` | Only check recent emails (days) | 7 |
| `DELETE_PROCESSED_EMAILS` | Move activation emails to trash | true |
| `LANGUAGE` | Interface language | en |
| `DEBUG_MODE` | Show detailed logs | false |

### Advanced Settings
<details>
<summary>Click to expand</summary>

| Variable | Description | Default |
|----------|-------------|---------|
| `IMAP_PORT` | IMAP port | 993 |
| `SMTP_PORT` | SMTP port | 587 |
| `AUTH_METHOD` | Authentication method | password |
| `MAX_RETRIES` | Connection retry attempts | 3 |
| `REMINDERS_FILE` | Where to save reminders | reminders.json |
| `PROCESSED_FILE` | Tracks processed messages | processed.json |
| `CUSTOM_TRANSLATIONS_PATH` | Custom language file | - |
| `HEARTBEAT_ENABLED` | Enable monitoring | false |
| `HEARTBEAT_URL` | BetterStack URL | - |
| `HEARTBEAT_INTERVAL` | Heartbeat frequency | 60 |

#### OAuth2 Settings (when AUTH_METHOD=oauth2)
| Variable | Description |
|----------|-------------|
| `OAUTH2_CLIENT_ID` | OAuth2 client ID |
| `OAUTH2_CLIENT_SECRET` | OAuth2 client secret |
| `OAUTH2_REFRESH_TOKEN` | OAuth2 refresh token |
| `OAUTH2_ACCESS_TOKEN` | Optional access token |
| `OAUTH2_PROVIDER` | google/microsoft/yahoo |

</details>

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

## 📬 Email Provider Compatibility

<details>
<summary><strong>✅ All major providers support plus addressing!</strong> (Click for details)</summary>

### Quick Reference

| Provider | Server Settings | Plus Addressing |
|----------|----------------|-----------------|
| **Gmail** | imap.gmail.com / smtp.gmail.com | ✅ Full support |
| **Outlook** | outlook.office365.com / smtp-mail.outlook.com | ✅ Full support |
| **Yahoo** | imap.mail.yahoo.com / smtp.mail.yahoo.com | ✅ Full support |
| **iCloud** | imap.mail.me.com / smtp.mail.me.com | ✅ Full support |
| **ProtonMail** | Via Bridge (127.0.0.1) | ✅ Full support |
| **FastMail** | imap.fastmail.com / smtp.fastmail.com | ✅ Full support |

### What You Need
- **Node.js 14+** to run the service
- **Email with IMAP/SMTP** access
- **Plus addressing** support (all major providers have this!)

</details>

---

## 🛠️ Troubleshooting

<details>
<summary><strong>Common Issues & Solutions</strong></summary>

### Authentication Failed?
- **Gmail**: You need an app password, not your regular password!
  - Enable 2FA first: https://myaccount.google.com/signinoptions/two-step-verification
  - Generate app password: https://myaccount.google.com/apppasswords
- **Outlook/Yahoo**: Same deal - use app passwords with 2FA

### Not receiving reminders?
- Check your spam folder
- Verify the email address in your .env matches exactly
- Make sure `BASE_DOMAIN` is set correctly
- Try `DEBUG_MODE=true` to see what's happening

### Service keeps disconnecting?
- Some email providers have rate limits
- Try increasing `CHECK_INTERVAL` to 120 or higher
- Check your email provider's IMAP connection limits

</details>

---

## 🎉 Contributing

Found a bug? Have an idea? PRs welcome! 

This is my personal project that I use daily, so I'm always interested in improvements that make it more useful.

## 📄 License

Apache 2.0 - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ☕ by <a href="https://github.com/mariusangelmann">Marius Angelmann</a>
<br>
<sub>Because everyone needs a reminder sometimes!</sub>
</div>
