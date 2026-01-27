// Gmail Integration for Invoice Email Sending
// Uses Replit's Gmail connector for authentication

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  mimeType: string;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const boundary = 'boundary_' + Date.now();
    let emailContent = '';
    
    // Build email headers
    emailContent += `To: ${options.to}\r\n`;
    emailContent += `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=\r\n`;
    emailContent += `MIME-Version: 1.0\r\n`;
    
    if (options.attachments && options.attachments.length > 0) {
      emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Text body
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
      emailContent += `${options.body}\r\n\r\n`;
      
      // Attachments
      for (const attachment of options.attachments) {
        emailContent += `--${boundary}\r\n`;
        emailContent += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
        emailContent += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        emailContent += `Content-Transfer-Encoding: base64\r\n\r\n`;
        emailContent += `${attachment.content}\r\n\r\n`;
      }
      
      emailContent += `--${boundary}--`;
    } else {
      emailContent += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
      emailContent += options.body;
    }
    
    // Encode to base64url
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    return { success: true, messageId: result.data.id || undefined };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
