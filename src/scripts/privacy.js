import PageInitializer from './utils/page-initializer.js';
import PageHeader from './components/page-header.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  const container = document.getElementById('privacy-container');
  container.innerHTML = `
    ${PageHeader.render({
      className: 'privacy',
      badge: 'gld__ privacy',
      title: 'Privacy Policy',
      description: 'How we handle your data. The short version: we collect very little and share none of it.'
    })}

    <div class="changelog-content">

      <div class="changelog-entry">
        <div class="changelog-date">Last updated: April 2026</div>
        <h3 class="changelog-title">Who We Are</h3>
        <p>gld__ is a hobby project built by a single developer. It's a World of Warcraft guild companion app hosted at <a href="https://crbntyp.com/gld/" class="footer-link">crbntyp.com/gld/</a>. This isn't a company — it's one person making tools for WoW players.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Authentication</h3>
        <p>You log in through <strong>Battle.net OAuth</strong> — Blizzard's official login system. We never see or store your password. The only permission we request is <code>wow.profile</code>, which gives us read-only access to your WoW character data.</p>
        <p>Your OAuth token is stored in your browser's localStorage only. It's never sent to or stored on our server. Tokens expire after 24 hours. Our backend verifies your identity by calling Blizzard's userinfo endpoint — we don't maintain our own user accounts or sessions.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">What We Store</h3>
        <p>We store the minimum needed to make features work. Here's exactly what goes into our database:</p>
        <p><strong>Raid signups</strong> — BattleTag, character name, realm, class, spec, item level, role, status, and any note you add.</p>
        <p><strong>M+ signups and groups</strong> — Same as raid signups, plus your M+ rating and group assignments.</p>
        <p><strong>Todos</strong> — Your personal todo items.</p>
        <p><strong>YouTube channels</strong> — Channels you've saved to your feed.</p>
        <p><strong>Vault snapshots</strong> — Weekly vault reward data for your characters.</p>
        <p>That's it. No email addresses. No real names. No payment information. No browsing history.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Analytics</h3>
        <p>We use a self-hosted analytics tool (stts) that we built ourselves. It tracks page views, scroll depth, and basic device info to help us understand which features people actually use.</p>
        <p>Here's what makes it different from Google Analytics or similar tools:</p>
        <p>&#8226; <strong>No cookies</strong> — none at all, anywhere on the site.</p>
        <p>&#8226; <strong>IPs are hashed</strong> — we never store your actual IP address.</p>
        <p>&#8226; <strong>Sessions use sessionStorage</strong> — they're wiped when you close the tab.</p>
        <p>&#8226; <strong>No third-party tracking</strong> — no Google Analytics, no Meta pixel, no ad networks.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Cookies</h3>
        <p>We don't use cookies. At all. No tracking cookies, no session cookies, no consent banners needed.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Third Parties</h3>
        <p>We don't sell, share, or give your data to anyone. The only external service we communicate with is the <strong>Blizzard Battle.net API</strong> to fetch your character data — which is exactly what you'd expect from a WoW companion app.</p>
        <p>We load fonts from Google Fonts and icons from Icons8's CDN. These services may log standard web requests (IP, user agent) per their own privacy policies.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Data Storage & Security</h3>
        <p>Your data is stored on a Hostinger VPS running Ubuntu with SSL encryption via Let's Encrypt. All connections to the site use HTTPS. The database runs MySQL 8.0 and is not publicly accessible.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Your Rights (GDPR)</h3>
        <p>If you're in the EU (or anywhere, really), you have the right to:</p>
        <p>&#8226; <strong>Access</strong> — Ask what data we have about you.</p>
        <p>&#8226; <strong>Delete</strong> — Ask us to delete your data. We'll remove everything tied to your BattleTag and Battle.net ID.</p>
        <p>&#8226; <strong>Portability</strong> — Ask for a copy of your data in a readable format.</p>
        <p>To make any of these requests, reach out via the <a href="https://crbntyp.com" class="footer-link" target="_blank" rel="noopener">crbntyp.com</a> portfolio site.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Data Retention</h3>
        <p>We keep your data for as long as it's useful. If you stop using the app, your raid signups and todo items stay unless you ask us to delete them. Login logs are kept for admin analytics purposes. You can request deletion at any time.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Children</h3>
        <p>This app isn't aimed at children under 13. We don't knowingly collect data from minors. If you're a parent and believe your child has used this app, contact us and we'll remove their data.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Changes</h3>
        <p>If we change this policy, we'll update the date at the top of this page. For a hobby project like this, changes will be rare — we're not suddenly going to start tracking you.</p>
      </div>

    </div>
  `;
});
