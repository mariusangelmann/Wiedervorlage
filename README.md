# Wiedervorlage - Your Personal Email Reminder Assistant

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Never forget important things again! This is my personal email-based reminder service that lets you schedule reminders by sending emails to special addresses. It's simple, effective, and has been super helpful for me.

## Cool Features

- Monitors your email inbox for new reminders
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

The following environment variables need to be configured in your `.env` file:

- `IMAP_HOST`: IMAP server host
- `IMAP_USER`: IMAP username
- `IMAP_PASSWORD`: IMAP password
- `SMTP_HOST`: SMTP server host
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password

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
| EMAIL_PASSWORD | Email password | - |
| BASE_DOMAIN | Domain for reminder addresses | - |
| CHECK_INTERVAL | Check interval in seconds | 60 |
| DEBUG_MODE | Enable debug mode | false |
| MAX_RETRIES | Maximum connection attempts | 3 |
| REMINDERS_FILE | Path to reminders file | reminders.json |
| LANGUAGE | Interface language (en/fr) | en |
| CUSTOM_TRANSLATIONS_PATH | Path to custom translations | - |
| HEARTBEAT_ENABLED | Enable BetterStack monitoring | false |
| HEARTBEAT_URL | BetterStack heartbeat URL | - |
| HEARTBEAT_INTERVAL | Heartbeat interval in seconds | Same as CHECK_INTERVAL |

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

### Email Service Compatibility

**Works Great With:**
- Your own email server (Postfix, Dovecot)
- Zoho Mail (using app password)
- iCloud Mail (using app password)
- FastMail
- ProtonMail Bridge
- Many business email providers that support basic authentication

**Won't Work With:**
- Gmail, Google Workspace (they use OAuth)
- Microsoft 365, Outlook.com (they use OAuth)
- Yahoo Mail (uses OAuth)

**Important Note:** Your email server needs to be set up to deliver all emails to `remind+ANYTHING@yourdomain.com` to the same inbox. Some servers need special configuration for this and some outright don't support it.

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
