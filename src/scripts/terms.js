import PageInitializer from './utils/page-initializer.js';
import PageHeader from './components/page-header.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  const container = document.getElementById('terms-container');
  container.innerHTML = `
    ${PageHeader.render({
      className: 'terms',
      badge: 'gld__ terms',
      title: 'Terms of Service',
      description: 'The ground rules. Nothing unexpected — just the basics.'
    })}

    <div class="changelog-content">

      <div class="changelog-entry">
        <div class="changelog-date">Last updated: April 2026</div>
        <h3 class="changelog-title">What This Is</h3>
        <p>gld__ is a free, fan-made World of Warcraft companion app. It's a hobby project — not a commercial product and not affiliated with or endorsed by Blizzard Entertainment. By using this app, you agree to these terms.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Your Account</h3>
        <p>You log in through Battle.net. We don't create accounts or store passwords. You're responsible for keeping your Battle.net account secure — that's between you and Blizzard. If you notice any unauthorised activity through gld__, log out and revoke the app's access in your <a href="https://account.blizzard.com/connections" class="footer-link" target="_blank" rel="noopener">Battle.net account settings</a>.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">What You Can Do</h3>
        <p>Use the app to browse guild rosters, sign up for raids, build M+ groups, track your collections, manage your todos, and all the other features listed on the site. Pretty straightforward.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">What You Shouldn't Do</h3>
        <p>Don't abuse the app or use it in ways that could harm other users or the service. Specifically:</p>
        <p>&#8226; Don't attempt to access other users' data or accounts.</p>
        <p>&#8226; Don't spam raid signups, flood the API, or try to break things.</p>
        <p>&#8226; Don't use bots or scripts to scrape data from the app.</p>
        <p>&#8226; Don't post offensive, abusive, or illegal content in raid notes or any other user-facing fields.</p>
        <p>If you do any of this, we'll block your access. No warnings necessary.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Your Content</h3>
        <p>Anything you create in the app — raid signups, todo items, notes — stays yours. We don't claim ownership of your content. We store it to make the features work, and we'll delete it if you ask.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Blizzard's Data</h3>
        <p>Character data, guild rosters, M+ leaderboards, and other game data comes from Blizzard's Battle.net API. That data belongs to Blizzard Entertainment. We display it under the terms of their API agreement. If Blizzard revokes API access, those features will stop working.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Availability</h3>
        <p>This is a hobby project run by one person. We don't guarantee 100% uptime, instant bug fixes, or that every feature will work perfectly all the time. The app depends on Blizzard's API — if their servers are down, parts of gld__ will be too.</p>
        <p>We can also shut down the app at any time. Hopefully that won't happen, but it's a free tool maintained in someone's spare time.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Liability</h3>
        <p>gld__ is provided "as is" with no warranties. We're not liable for any damages or losses from using (or not being able to use) the app. This includes data loss, missed raid signups, or anything else that might go wrong.</p>
        <p>We don't make money from this app. There are no ads, no premium tiers, and no paid features.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Intellectual Property</h3>
        <p>World of Warcraft, Battle.net, and related assets are trademarks of Blizzard Entertainment. gld__ is a fan project and is not produced, endorsed, or supported by Blizzard.</p>
        <p>The gld__ app code and design are by <a href="https://crbntyp.com" class="footer-link" target="_blank" rel="noopener">crbntyp</a>.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Changes</h3>
        <p>We might update these terms occasionally. If we do, the date at the top will change. Continued use of the app after changes means you accept the new terms.</p>
      </div>

      <div class="changelog-entry">
        <h3 class="changelog-title">Contact</h3>
        <p>Questions or concerns? Reach out via the <a href="https://crbntyp.com" class="footer-link" target="_blank" rel="noopener">crbntyp.com</a> portfolio site.</p>
      </div>

    </div>
  `;
});
