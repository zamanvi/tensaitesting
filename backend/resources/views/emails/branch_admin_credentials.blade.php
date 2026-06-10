<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Branch Admin Access – {{ $branchName }}</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: #0d1117; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.45); font-size: 13px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 12px; }
    .text { font-size: 14px; color: #475569; line-height: 1.65; margin-bottom: 20px; }
    .credentials { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .cred-value { font-size: 14px; font-weight: 600; color: #0f172a; font-family: 'Courier New', monospace; }
    .btn { display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 14px; font-weight: 700; margin: 8px 0 24px; }
    .warning { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #92400e; margin-top: 4px; }
    .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Tensai Admin Panel</h1>
      <p>{{ $branchName }} — Branch Admin Access</p>
    </div>
    <div class="body">
      <p class="greeting">Hi {{ $adminName }},</p>
      <p class="text">
        You have been assigned as the <strong>Branch Admin</strong> for <strong>{{ $branchName }}</strong> on the Tensai platform.
        Use the credentials below to log in to the admin panel.
      </p>

      <div class="credentials">
        <div class="cred-row">
          <span class="cred-label">Email</span>
          <span class="cred-value">{{ $email }}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Password</span>
          <span class="cred-value">{{ $plainPassword }}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Branch</span>
          <span class="cred-value">{{ $branchName }}</span>
        </div>
      </div>

      <div style="text-align:center;">
        <a href="{{ $loginUrl }}" class="btn">Log In to Admin Panel →</a>
      </div>

      <div class="warning">
        ⚠️ Please change your password immediately after your first login. Keep these credentials secure and do not share them.
      </div>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} Tensai Consultancy. This email was sent to {{ $email }}.</p>
    </div>
  </div>
</body>
</html>
