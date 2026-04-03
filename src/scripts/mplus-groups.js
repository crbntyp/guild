import PageInitializer from './utils/page-initializer.js';
import MplusManager from './components/mplus-manager.js';
import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => {
        window.location.reload();
      });

      // Save Discord server context from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      const nameParam = urlParams.get('name');
      if (serverParam) {
        localStorage.setItem('gld_groups_server', serverParam);
        if (nameParam) localStorage.setItem('gld_groups_server_name', nameParam);
      }

      // Save link params before auth redirect (they get lost in OAuth flow)
      const linkDiscord = urlParams.get('link_discord');
      const linkToken = urlParams.get('link_token');
      if (linkDiscord && linkToken) {
        sessionStorage.setItem('gld_link_discord', linkDiscord);
        sessionStorage.setItem('gld_link_token', linkToken);
        sessionStorage.setItem('gld_claim_return', window.location.pathname);
      }

      if (authService.isAuthenticated()) {
        const manager = new MplusManager('mplus-groups-container', authService);
        await manager.init();
      } else {
        const container = document.getElementById('mplus-groups-container');

        const savedServer = serverParam || localStorage.getItem('gld_groups_server');
        const savedName = nameParam || localStorage.getItem('gld_groups_server_name');

        if (savedServer) {
          // Has Discord context — prompt to log in
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ groups</div>
                <h1>Welcome${savedName ? ` from ${savedName}` : ''}!</h1>
                <p class="raids-landing-subtitle">Log in with your Battle.net account to sign up for events and get assigned to a team.</p>
              </div>

              <div class="raids-landing-cta">
                <button class="btn-login-raids" id="btn-login-groups">
                  <i class="las la-user"></i>
                  Login with Battle.net
                </button>
              </div>

              <div class="raids-landing-section-title">How it works</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-calendar-check"></i>
                  </div>
                  <h3>Sign Up</h3>
                  <p>Pick your character and role for an upcoming event. Keys, timewalking, dungeons — whatever's on.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-magic"></i>
                  </div>
                  <h3>Auto-Assign</h3>
                  <p>One button and balanced 5-man groups are built from the signup pool based on ilvl and rating.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-users"></i>
                  </div>
                  <h3>Your Team</h3>
                  <p>Every group gets a randomly generated team name. Drag and drop to fine-tune, then save and go.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-lock"></i>
                  </div>
                  <h3>Role Permissions</h3>
                  <p>Server owners control who can create groups with <code>/settings</code>. Set a minimum Discord role and only members at that rank or above can create.</p>
                </div>
              </div>

              <div class="raids-landing-cta">
                <span class="btn-add-bot disabled">
                  <i class="lab la-discord"></i>
                  Discord Bot — Coming Soon
                </span>
              </div>
            </div>
          `;
          document.getElementById('btn-login-groups')?.addEventListener('click', () => authService.login());
        } else {
          // No Discord context — general landing
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ groups</div>
                <h1>Group Builder</h1>
                <p class="raids-landing-subtitle">A smart group builder for M+ keys, timewalking, dungeons, and more. Sign up, get assigned to a balanced 5-man team, and go.</p>
              </div>

              <div class="home-demo-carousel" style="margin-bottom: 40px">
                <div class="home-demo-track">

                  <div class="mplus-session-card demo-card" style="min-width: 320px; max-width: 320px; pointer-events: none">
                    <div class="mplus-card-banner" style="background-image: url('https://render.worldofwarcraft.com/eu/zones/windrunner-spire-small.jpg')">
                      <div class="mplus-card-banner-overlay"></div>
                      <div class="mplus-card-banner-content">
                        <div class="mplus-card-title">
                          <h3>Wednesday Key Night</h3>
                          <span class="mplus-card-status status-open">open</span>
                        </div>
                        <div class="mplus-card-date">
                          <span class="mplus-date">Wed, 8 Apr</span>
                          <span class="mplus-time">20:00</span>
                          <span class="mplus-countdown">5d 8h</span>
                        </div>
                        <p class="mplus-card-description">Weekly push night - all key levels welcome</p>
                      </div>
                    </div>
                    <div class="mplus-card-stats">
                      <div class="mplus-stat"><span class="mplus-stat-icon tank"><i class="las la-shield-alt"></i></span><span class="mplus-stat-count">3</span></div>
                      <div class="mplus-stat"><span class="mplus-stat-icon healer"><i class="las la-plus-circle"></i></span><span class="mplus-stat-count">3</span></div>
                      <div class="mplus-stat"><span class="mplus-stat-icon dps"><i class="las la-crosshairs"></i></span><span class="mplus-stat-count">9</span></div>
                      <span class="mplus-stat-groups">3 groups possible</span>
                    </div>
                    <div class="mplus-card-roster">
                      <div class="mplus-signups-list">
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label tank">Tanks</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #A330C9">Felbladë</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2450)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FF7D0A">Slothinator</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2180)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #C41F3B">Nocturn</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2050)</span></div>
                        </div>
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label healer">Healers</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FFFFFF">Solstice</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2520)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FF7D0A">Verdant</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2380)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #33937F">Emberwing</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2210)</span></div>
                        </div>
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label dps">DPS</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #40C7EB">Scorch</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2710)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #A330C9">Havok</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2620)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FFF569">Bladesong</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2540)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #ABD473">Grimshot</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2490)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #8787ED">Voidcaller</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2350)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #0070DE">Stormhoof</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2300)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #00FF96">Ashveil</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2150)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #F58CBA">Cinderstrike</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2280)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #C79C6E">Thornblade</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2440)</span></div>
                        </div>
                      </div>
                    </div>
                    <div class="mplus-card-actions">
                      <button class="btn-mplus-signup" disabled>Sign Up</button>
                    </div>
                  </div>

                  <div class="demo-card" style="min-width: 600px; max-width: 600px; height: 380px; pointer-events: none; background: rgba(0,0,0,0.2); border: 1px solid rgba(163,53,238,0.2); border-radius: 5px; padding: 16px; overflow: hidden">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)">
                  <span style="font-size:14px;font-weight:700;color:#fff">Group Builder</span>
                  <div style="display:flex;gap:6px;margin-left:auto">
                    <span style="font-size:10px;padding:4px 10px;background:rgba(163,53,238,0.12);border:1px solid rgba(163,53,238,0.25);border-radius:4px;color:#fff;font-weight:600">Auto-Assign</span>
                    <span style="font-size:10px;padding:4px 10px;background:rgba(163,53,238,0.12);border:1px solid rgba(163,53,238,0.25);border-radius:4px;color:#fff;font-weight:600">Save</span>
                  </div>
                </div>
                <div style="display:flex;gap:12px">
                  <div style="width:140px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.06);padding-right:12px">
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:8px">Pool (6)</div>
                    <div style="font-size:9px;color:#0070DE;font-weight:700;margin-bottom:4px">TANKS (1)</div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#C41F3B">Nocturn</span></div>
                    <div style="font-size:9px;color:#ff5050;font-weight:700;margin:8px 0 4px">DPS (5)</div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#00FF96">Ashveil</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#F58CBA">Cinderstrike</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:2px dashed rgba(245,158,11,0.4)"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#0070DE">Stormhoof</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#C79C6E">Thornblade</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#40C7EB">Pyroblast</span></div>
                  </div>
                  <div style="flex:1;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start">
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Cosmic Badgers</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">5/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#A330C9">Felbladë</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FFFFFF">Solstice</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#40C7EB">Scorch</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#A330C9">Havok</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FFF569">Bladesong</span></div>
                    </div>
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Void Llamas</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">5/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FF7D0A">Slothinator</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FF7D0A">Verdant</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#ABD473">Grimshot</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#8787ED">Voidcaller</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#0070DE">Tidecaller</span></div>
                    </div>
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Neon Warlords</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">4/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#33937F">Emberwing</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#33937F">Lifespark</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#8787ED">Felfire</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#F58CBA">Retbull</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:3px 6px;border:1px dashed rgba(255,255,255,0.06);border-radius:4px;color:rgba(255,255,255,0.12)"><i class="las la-crosshairs" style="font-size:11px"></i><span style="font-size:9px">DPS</span></div>
                    </div>
                  </div>
                </div>
              </div>

                  <div class="mplus-session-card demo-card" style="min-width: 320px; max-width: 320px; pointer-events: none">
                    <div class="mplus-card-banner" style="background-image: url('https://render.worldofwarcraft.com/eu/zones/skyreach-small.jpg')">
                      <div class="mplus-card-banner-overlay"></div>
                      <div class="mplus-card-banner-content">
                        <div class="mplus-card-title">
                          <h3>Saturday Timewalking</h3>
                          <span class="mplus-card-status status-open">open</span>
                        </div>
                        <div class="mplus-card-date">
                          <span class="mplus-date">Sat, 5 Apr</span>
                          <span class="mplus-time">18:00</span>
                          <span class="mplus-countdown">2d 6h</span>
                        </div>
                        <p class="mplus-card-description">BC Timewalking - bring your alts!</p>
                      </div>
                    </div>
                    <div class="mplus-card-stats">
                      <div class="mplus-stat"><span class="mplus-stat-icon tank"><i class="las la-shield-alt"></i></span><span class="mplus-stat-count">1</span></div>
                      <div class="mplus-stat"><span class="mplus-stat-icon healer"><i class="las la-plus-circle"></i></span><span class="mplus-stat-count">1</span></div>
                      <div class="mplus-stat"><span class="mplus-stat-icon dps"><i class="las la-crosshairs"></i></span><span class="mplus-stat-count">6</span></div>
                      <span class="mplus-stat-groups">1 group possible</span>
                    </div>
                    <div class="mplus-card-roster">
                      <div class="mplus-signups-list">
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label tank">Tanks</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #F58CBA">Bäsics</span><span class="mplus-signup-rating"><i class="las la-star"></i> (1890)</span></div>
                        </div>
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label healer">Healers</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FFFFFF">Solstice</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2520)</span></div>
                        </div>
                        <div class="mplus-signup-group">
                          <span class="mplus-signup-role-label dps">DPS</span>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #0070DE">Stormhoof</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2300)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #00FF96">Ashveil</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2150)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #ABD473">Grimshot</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2490)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #C41F3B">Nocturn</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2050)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #FF7D0A">Slothinator</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2180)</span></div>
                          <div class="mplus-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" class="mplus-signup-icon" /><span class="mplus-signup-name" style="color: #33937F">Emberwing</span><span class="mplus-signup-rating"><i class="las la-star"></i> (2210)</span></div>
                        </div>
                      </div>
                    </div>
                    <div class="mplus-card-actions">
                      <span class="mplus-signed-up">Signed up as Bäsics</span>
                      <button class="btn-mplus-withdraw" disabled>Withdraw</button>
                    </div>
                  </div>

                </div>
              </div>

              <div class="raids-landing-section-title">How it works</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="lab la-discord"></i>
                  </div>
                  <h3>Discord Powered</h3>
                  <p>Events are created from Discord with the <code>/group</code> command. A signup link is posted to your channel.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-magic"></i>
                  </div>
                  <h3>Smart Groups</h3>
                  <p>Auto-assign builds balanced groups using ilvl and M+ rating. Snake draft ensures no group is stacked.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-dice"></i>
                  </div>
                  <h3>Team Names</h3>
                  <p>Every group gets a randomly generated name. Cosmic Badgers, Void Llamas, Neon Warlords — re-roll until you're happy.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-hand-pointer"></i>
                  </div>
                  <h3>Drag & Drop</h3>
                  <p>Manually adjust groups by dragging players between teams. Save when done.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-lock"></i>
                  </div>
                  <h3>Role Permissions</h3>
                  <p>Server owners control who can create groups with <code>/settings</code>. Set a minimum Discord role and only members at that rank or above can create.</p>
                </div>
              </div>

              <div class="raids-landing-cta">
                <p class="raids-landing-cta-text">Click a signup link from your Discord server to get started.</p>
                <p class="raids-landing-cta-sub">Events are created via the <code>/group</code> command in Discord by members with the right role.</p>
                <span class="btn-add-bot disabled">
                  <i class="lab la-discord"></i>
                  Discord Bot — Coming Soon
                </span>
              </div>
            </div>
          `;
        }
      }
    }
  });
});
