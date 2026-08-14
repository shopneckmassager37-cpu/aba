// Vercel Edge Middleware — runs before any page is served.
//
// Chefaleh delivers only within South Florida and has no EU/UK/EEA
// customers, so visitors browsing from those regions are shown a short
// notice instead of the site. This removes the GDPR / UK-GDPR "consent
// before tracking" obligation for this site entirely, rather than trying
// to satisfy it with a banner — see analytics.js, cookie-policy.html and
// privacy-policy.html.
//
// To add or remove a country, edit BLOCKED_COUNTRIES below — nothing else
// needs to change. Codes are ISO 3166-1 alpha-2, matching the
// x-vercel-ip-country header Vercel sets on every request.
export const config = {
  matcher: '/((?!api/).*)',
};

const BLOCKED_COUNTRIES = new Set([
  // European Union (27)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA, non-EU (applies EU law directly)
  'IS', 'LI', 'NO',
  // United Kingdom (UK-GDPR mirrors EU GDPR)
  'GB',
]);

const BLOCK_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Chefaleh</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#1A1A1A; color:#F9F7F2; font-family:Georgia,'Times New Roman',serif; text-align:center; padding:2rem; }
  .box { max-width:30rem; }
  h1 { font-weight:400; font-size:1.5rem; letter-spacing:.3em; text-transform:uppercase; color:#D4AF37; margin:0 0 1.5rem; }
  p { font-size:.95rem; line-height:1.7; color:rgba(249,247,242,.75); margin:0 0 .75rem; }
  a { color:#D4AF37; }
</style>
</head>
<body>
  <div class="box">
    <h1>Chefaleh</h1>
    <p>Chefaleh is a Shabbat delivery service serving South Florida only, and isn't available to visitors browsing from the EU, UK or EEA.</p>
    <p>Questions? <a href="mailto:chefaleh@gmail.com">chefaleh@gmail.com</a></p>
  </div>
</body>
</html>`;

export default function middleware(request) {
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  if (BLOCKED_COUNTRIES.has(country)) {
    return new Response(BLOCK_PAGE, {
      status: 451,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
}
