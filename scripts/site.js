import { aboutPage } from "../content/about.js?v=2";
import { eventsPage } from "../content/events-page.js?v=2";
import { homePage } from "../content/home.js?v=2";
import { joinPage } from "../content/join-page.js?v=2";
import { site } from "../content/site.js?v=2";
import { teamPage } from "../content/team-page.js?v=3";

const pages = {
  home: homePage,
  about: aboutPage,
  events: eventsPage,
  team: teamPage,
  join: joinPage,
  event: { title: "Event Details", description: "NUS ACM-W event details and registration" },
};

const page = document.body.dataset.page || "home";
const pageData = pages[page];
const main = document.querySelector("[data-page-content]");
const isHomePage = page === "home";

async function loadEventsData() {
  try {
    const res = await fetch(getAssetHref("content/events.json"));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not load content/events.json, using fallback events if available.", err);
  }
  return toArray(eventsPage.events);
}

async function loadTeamData() {
  try {
    const res = await fetch(getAssetHref("content/team.json"));
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) || (data && (Array.isArray(data.members) || Array.isArray(data.sections)))) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Could not load content/team.json, using fallback team members if available.", err);
  }
  return toArray(teamPage.members);
}

function categorizeEvents(eventsList) {
  const now = new Date();
  const upcoming = [];
  const past = [];

  toArray(eventsList).forEach((evt) => {
    const timeBoundaryStr = evt.endDate || evt.startDate;
    if (!timeBoundaryStr) {
      upcoming.push(evt);
      return;
    }
    const evtDate = new Date(timeBoundaryStr);
    if (isNaN(evtDate.getTime()) || evtDate >= now) {
      upcoming.push(evt);
    } else {
      past.push(evt);
    }
  });

  upcoming.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));
  past.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));

  return { upcoming, past, all: eventsList };
}

async function initApp() {
  updateDocumentMetadata(pageData);

  const rawEvents = await loadEventsData();
  const rawTeam = await loadTeamData();
  const categorizedEvents = categorizeEvents(rawEvents);

  if (main) {
    main.innerHTML = `
      ${renderHeader()}
      <main class="site-main">
        <div class="container">
          ${renderPage(page, categorizedEvents, rawTeam)}
        </div>
      </main>
      ${renderFooter()}
    `;

    if (page === "join" && typeof main.querySelectorAll === "function") {
      initializeJoinTabs(main);
    }
  }
}

initApp();

function renderHeader() {
  const brand = renderBrand();
  const navLinks = toArray(site.navigation)
    .map(renderNavLink)
    .filter(Boolean)
    .join("");

  if (!brand && !navLinks) {
    return "";
  }

  return `
    <header class="site-header">
      <div class="container site-header__inner">
        ${brand}
        ${navLinks ? `<nav class="site-nav" aria-label="Primary">${navLinks}</nav>` : ""}
      </div>
    </header>
  `;
}

function renderBrand() {
  const chapter = site.chapter || {};
  const logo = value(chapter.logo);
  const name = value(chapter.name);
  const location = value(chapter.location);
  const shortName = value(chapter.shortName);
  const brandSuffix = value(chapter.brandSuffix);

  if (!logo && !name && !location) {
    return "";
  }

  return `
    <a class="brand" href="${attr(getPageHref("home"))}" aria-label="${attr(`Go to ${shortName || name || "home"} home page`)}">
      ${logo ? `<img class="brand__logo" src="${attr(getAssetHref(logo))}" alt="${attr(chapter.logoAlt || `${shortName || name} logo`)}" loading="lazy" decoding="async">` : ""}
      ${name || location
      ? `<div class="brand__copy">
            ${location ? `<p class="brand__eyebrow">${html(location)}</p>` : ""}
            ${name ? `<p class="brand__title">${html(name)}${brandSuffix ? ` <span>${html(brandSuffix)}</span>` : ""}</p>` : ""}
          </div>`
      : ""}
    </a>
  `;
}

function renderNavLink(item) {
  const label = value(item?.label);
  const href = getLinkHref(item);

  if (!label || !href) {
    return "";
  }

  const current = item.page === page;
  return `<a href="${attr(href)}" ${current ? 'aria-current="page"' : ""}>${html(label)}</a>`;
}

function renderFooter() {
  const chapter = site.chapter || {};
  const shortName = value(chapter.shortName);
  const location = value(chapter.location);
  const links = toArray(site.socialLinks)
    .map(renderFooterLink)
    .filter(Boolean)
    .join("");
  const chapterDetails = shortName || location
    ? `<div>
        ${shortName ? `<strong>${html(shortName)}</strong>` : ""}
        ${location ? `<div>${html(location)}</div>` : ""}
      </div>`
    : "";

  if (!chapterDetails && !links) {
    return "";
  }

  return `
    <footer class="footer">
      <div class="container footer__inner">
        ${chapterDetails}
        ${links ? `<div class="footer__links">${links}</div>` : ""}
      </div>
    </footer>
  `;
}

function getSocialIcon(type, href) {
  if (type === "instagram" || (href && href.includes("instagram.com"))) {
    return `<svg class="footer__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
  }
  if (type === "x" || type === "twitter" || (href && (href.includes("x.com") || href.includes("twitter.com")))) {
    return `<svg class="footer__icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  }
  if (type === "email" || (href && href.startsWith("mailto:"))) {
    return `<svg class="footer__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  }
  return "";
}

function renderFooterLink(item) {
  const label = value(item?.label);
  const href = value(item?.href);
  const type = value(item?.type);

  if (!label || !href) {
    return "";
  }

  const icon = getSocialIcon(type, href);
  const external = isExternalHref(href);

  return `<a href="${attr(href)}" class="footer__link" ${external ? 'target="_blank" rel="noreferrer"' : ""}>${icon}<span>${html(label)}</span></a>`;
}

function renderPage(currentPage, categorizedEvents = { upcoming: [], past: [] }, teamMembers = []) {
  if (currentPage === "home") {
    return renderHomePage(homePage, categorizedEvents);
  }

  if (currentPage === "about") {
    return renderAboutPage(aboutPage);
  }

  if (currentPage === "events") {
    return renderEventsPage(eventsPage, categorizedEvents);
  }

  if (currentPage === "event") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const allEvents = categorizedEvents.all || [];
    const matchedEvent = allEvents.find((evt) => evt.id === id) || allEvents[0];
    if (matchedEvent?.title) {
      document.title = `${matchedEvent.title} - NUS ACM-W`;
    }
    return renderEventDetailPage(matchedEvent);
  }

  if (currentPage === "team") {
    const teamData = {
      ...teamPage,
      ...(Array.isArray(teamMembers)
        ? { members: teamMembers }
        : typeof teamMembers === "object" && teamMembers !== null
          ? teamMembers
          : { members: teamPage.members }),
    };
    return renderTeamPage(teamData);
  }

  if (currentPage === "join") {
    return renderJoinPage(joinPage);
  }

  return renderNotFoundPage();
}

function renderHomePage(data, categorizedEvents = { upcoming: [], past: [] }) {
  const hero = data.hero || {};
  const heroActions = renderActionRow(hero.actions, "hero__actions");
  const heroImage = value(hero.image || site.chapter?.logo);
  const eventsPreview = data.eventsPreview || {};
  const eventLimit = Number.isFinite(eventsPreview.limit) ? eventsPreview.limit : 2;
  const visibleEvents = toArray(categorizedEvents.upcoming).slice(0, eventLimit);

  return `
    ${value(hero.heading) || value(hero.intro) || heroActions || heroImage
      ? `<section class="hero">
          <div class="hero__inner${heroImage ? "" : " hero__inner--text-only"}">
            <div>
              ${value(hero.heading) ? `<h1>${html(hero.heading)}</h1>` : ""}
              ${value(hero.intro) ? `<p>${html(hero.intro)}</p>` : ""}
              ${heroActions}
            </div>
            ${heroImage
        ? `<aside class="hero__panel">
                  <img src="${attr(getAssetHref(heroImage))}" alt="${attr(hero.imageAlt || site.chapter?.logoAlt || "")}" decoding="async">
                </aside>`
        : ""}
          </div>
        </section>`
      : ""}

    ${renderEventSection({
        heading: eventsPreview.heading || "Upcoming events",
        intro: eventsPreview.intro,
        events: visibleEvents,
        emptyState: eventsPreview.emptyState || "Something is brewing... Check back soon!",
      })}
  `;
}

function renderAboutPage(data) {
  const missionCards = [data.missionAlignment, data.chapterIdentity].filter(Boolean);
  const contextCards = [
    { title: data.context?.fitTitle, text: data.context?.fitText },
    { title: data.context?.whyTitle, text: data.context?.whyText },
  ].filter((c) => value(c.title) || value(c.text));
  const pillars = toArray(data.pillars?.items);
  const communityCards = toArray(data.communityFocus?.items);
  const calloutActions = renderActionRow(data.callout?.actions, "hero__actions");

  return `
    ${renderPageHeading(data)}

    ${renderPillarSection({
    heading: data.pillars?.title,
    intro: data.pillars?.intro,
    items: pillars,
  })}

    ${communityCards.length
      ? renderCardSection({
        heading: data.communityFocus?.title,
        intro: data.communityFocus?.intro,
        cards: communityCards,
        gridClass: "grid--three",
      })
      : ""}

    ${renderAffiliationSection({
        heading: data.context?.title,
        intro: data.context?.intro,
        cards: contextCards,
        gridClass: "grid--two",
        logo: data.context?.logo,
        logoAlt: data.context?.logoAlt,
        url: data.context?.url,
      })}

    ${value(data.callout?.heading) || value(data.callout?.text) || calloutActions
      ? `<section class="section">
          <div class="section__cta">
            <div>
              ${value(data.callout?.heading) ? `<h3>${html(data.callout.heading)}</h3>` : ""}
              ${value(data.callout?.text) ? `<p>${html(data.callout.text)}</p>` : ""}
            </div>
            ${calloutActions}
          </div>
        </section>`
      : ""}
  `;
}

function renderEventsPage(data, categorizedEvents = { upcoming: [], past: [] }) {
  const upcomingEvents = toArray(categorizedEvents.upcoming);
  const pastEvents = toArray(categorizedEvents.past);
  const newsHeading = data.newsHeading || data.pastHeading || "Recent News";
  const newsEmptyState = data.newsEmptyState || data.pastEmptyState || "No recent news updates to show yet.";

  return `
    ${renderPageHeading(data)}

    ${renderEventSection({
    heading: data.upcomingHeading || "Upcoming Events",
    events: upcomingEvents,
    emptyState: data.upcomingEmptyState || site.upcomingEventsEmptyState,
  })}

    ${pastEvents.length || newsHeading
      ? renderEventSection({
        heading: newsHeading,
        events: pastEvents,
        emptyState: newsEmptyState,
      })
      : ""}
  `;
}

function renderEventDetailPage(event) {
  if (!event) {
    return `
      <section class="section">
        <a class="back-link" href="${attr(getPageHref("events"))}">&larr; Back to all events & news</a>
        ${renderUtilityNote("Event or news update not found. Please check back later or view our full list of events & news.")}
      </section>
    `;
  }

  const title = value(event.title || "Event");
  const now = new Date();
  const timeBoundaryStr = event.endDate || event.startDate;
  const isPast = timeBoundaryStr && !isNaN(new Date(timeBoundaryStr).getTime()) && new Date(timeBoundaryStr) < now;

  const summary = value((isPast ? event.recapSummary || event.summary : event.upcomingSummary || event.summary));
  const upcomingDesc = !isPast ? value(event.upcomingDescription || event.description) : "";
  const recapDesc = value(event.recapDescription || (isPast ? event.description : ""));
  const dateStr = value(event.displayDate || event.date);
  const timeStr = formatTo24HourTime(value(event.displayTime || event.time));
  const venueStr = value(event.venue || event.location);
  const poster = value(event.poster || event.image);
  const signUpUrl = value(event.signUpUrl);
  const gallery = toArray(event.gallery);

  const posterPath = poster ? getAssetHref(poster) : "";

  const statusBadge = isPast
    ? `<span class="event-status-badge event-status-badge--past">Recent News</span>`
    : `<span class="event-status-badge event-status-badge--upcoming">Upcoming Event</span>`;

  const galleryMarkup = gallery.length
    ? `<div class="event-detail__gallery-section">
        <h3>Event Highlights & Photos</h3>
        <div class="event-detail__gallery-grid">
          ${gallery
      .map(
        (imgSrc, idx) => `
            <a href="${attr(getAssetHref(imgSrc))}" target="_blank" rel="noopener noreferrer" class="event-detail__gallery-item">
              <img src="${attr(getAssetHref(imgSrc))}" alt="${attr(`${title} photo ${idx + 1}`)}" loading="lazy" decoding="async">
            </a>
          `
      )
      .join("")}
        </div>
       </div>`
    : "";

  return `
    <div class="event-detail-page">
      <div class="event-detail-header">
        <a class="back-link" href="${attr(getPageHref("events"))}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to all events & news
        </a>
      </div>

      <article class="event-detail">
        <div class="event-detail__sidebar">
          <div class="event-detail__cta-card">
            ${signUpUrl && !isPast
      ? `<a class="button button--primary button--full button--lg" href="${attr(signUpUrl)}" target="_blank" rel="noreferrer">
                  Sign Up Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                </a>`
      : ""}

            <div class="event-detail__info-list">
              ${dateStr
      ? `<div class="event-detail__info-item">
                    <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                      <strong>${isPast ? "Date" : "Date & Time"}</strong>
                      <div>${html(dateStr)}${timeStr && !isPast ? `<br>${html(timeStr)}` : ""}</div>
                    </div>
                  </div>`
      : ""}

              ${venueStr
      ? `<div class="event-detail__info-item">
                    <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div>
                      <strong>Venue</strong>
                      <div>${html(venueStr)}</div>
                    </div>
                  </div>`
      : ""}
            </div>
          </div>
        </div>

        <div class="event-detail__main">
          <div class="event-detail__meta-top">
            ${statusBadge}
          </div>

          <h1 class="event-detail__title">${html(title)}</h1>

          ${summary ? `<p class="event-detail__lead">${html(summary)}</p>` : ""}

          <div class="event-detail__description">
            ${galleryMarkup}
            ${recapDesc ? `<section class="event-detail__section">${formatMarkdownText(recapDesc)}</section>` : ""}
            ${upcomingDesc ? `<section class="event-detail__section"><h3>About the Event</h3>${formatMarkdownText(upcomingDesc)}</section>` : ""}
          </div>
        </div>
      </article>
    </div>
  `;
}

function formatMarkdownText(text) {
  if (!text) return "";
  const blocks = String(text).split(/\n\n+/);
  return blocks.map((block) => {
    block = block.trim();
    if (!block) return "";

    if (block.startsWith("### ")) {
      const headingText = html(block.slice(4)).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return `<h3>${headingText}</h3>`;
    }

    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const isList = lines.length > 0 && lines.every((l) => l.startsWith("- ") || l.startsWith("* "));

    if (isList) {
      const items = lines.map((item) => {
        const cleaned = item.replace(/^[-*]\s+/, "");
        const formatted = html(cleaned).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return `<li>${formatted}</li>`;
      }).join("");
      return `<ul>${items}</ul>`;
    }

    const formattedParagraph = html(block).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return `<p>${formattedParagraph.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function renderTeamPage(data) {
  let members = [];
  let sections = [];

  if (Array.isArray(data)) {
    members = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.sections)) {
      sections = data.sections;
    }
    if (Array.isArray(data.members)) {
      members = data.members;
    }
  }

  if (!sections.length && members.length) {
    const hasCategories = members.some((m) => m?.category || m?.group || m?.section);
    if (hasCategories) {
      const categoryMap = new Map();
      const categorySubtitles = {
        "Faculty Advisor": "Guiding the chapter's vision, faculty relations, and academic integration.",
        "Executive Committee": "Leading student chapter initiatives, events, membership, and community activities.",
      };
      const categoryOrder = ["Faculty Advisor", "Executive Committee"];

      members.forEach((m) => {
        const cat = value(m?.category || m?.group || m?.section) || "Executive Committee";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, []);
        }
        categoryMap.get(cat).push(m);
      });

      const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });

      sections = sortedCategories.map((heading) => ({
        heading,
        intro: categorySubtitles[heading] || "",
        members: categoryMap.get(heading),
      }));
    }
  }

  let contentMarkup = "";

  if (sections.length) {
    contentMarkup = sections
      .map((sec) => {
        const secMembers = toArray(sec.members);
        const visibleMembers = secMembers.map(renderMember).filter(Boolean);
        if (!visibleMembers.length) return "";

        const gridClass = visibleMembers.length < 3 ? "grid grid--centered" : "grid grid--three";

        return `
          <section class="section team-section">
            <div class="team-section__header">
              <h2 class="team-section__title">${html(sec.heading)}</h2>
              ${sec.intro ? `<p class="team-section__subtitle">${html(sec.intro)}</p>` : ""}
            </div>
            <div class="${gridClass}">${visibleMembers.join("")}</div>
          </section>
        `;
      })
      .filter(Boolean)
      .join("");
  } else if (members.length) {
    const visibleMembers = members.map(renderMember).filter(Boolean);
    contentMarkup = visibleMembers.length
      ? `<section class="section"><div class="grid grid--three">${visibleMembers.join("")}</div></section>`
      : renderUtilityNote(data.emptyState || teamPage.emptyState);
  } else {
    contentMarkup = renderUtilityNote(data.emptyState || teamPage.emptyState);
  }

  return `
    ${renderPageHeading(data)}
    ${contentMarkup}
    ${renderCallout(data.callout || teamPage.callout)}
  `;
}

function renderJoinPage(data) {
  const tabs = toArray(data.tabs);

  if (tabs.length) {
    return `
      ${renderPageHeading(data)}
      ${renderJoinTabs(tabs)}
    `;
  }

  const application = data.application || {};
  const formAction = getJoinFormAction(data);
  const applicationPanel = value(application.title) || value(application.text) || formAction
    ? `<div class="section__cta">
        ${value(application.title) || value(application.text)
      ? `<div>
              ${value(application.title) ? `<h3>${html(application.title)}</h3>` : ""}
              ${value(application.text) ? `<p>${html(application.text)}</p>` : ""}
            </div>`
      : ""}
        ${formAction}
      </div>`
    : "";
  const faq = data.faq || {};

  return `
    ${renderPageHeading(data)}

    ${renderCardSection({
    cards: data.audienceCards,
    gridClass: "grid--three",
  })}

    ${value(application.heading) || value(application.intro) || applicationPanel
      ? `<section class="section">
          ${renderSectionHeader(application.heading, application.intro)}
          ${applicationPanel}
        </section>`
      : ""}

    ${renderCardSection({
        heading: faq.heading,
        intro: faq.intro,
        cards: faq.items,
        gridClass: "grid--two",
        cardRenderer: renderFaqCard,
      })}
  `;
}

function renderJoinTabs(tabs) {
  const visibleTabs = tabs
    .map((tab, index) => ({ ...tab, tabId: getStableId(tab.id || tab.label || `tab-${index + 1}`) }))
    .filter((tab) => value(tab.label) || value(tab.heading) || value(tab.intro));

  if (!visibleTabs.length) {
    return "";
  }

  const tabButtons = visibleTabs
    .map((tab, index) => `
      <button
        class="join-tabs__button"
        type="button"
        role="tab"
        id="join-tab-${attr(tab.tabId)}"
        aria-controls="join-panel-${attr(tab.tabId)}"
        aria-selected="${index === 0 ? "true" : "false"}"
        tabindex="${index === 0 ? "0" : "-1"}"
        data-join-tab="${attr(tab.tabId)}"
      >
        ${html(tab.label || tab.heading)}
      </button>
    `)
    .join("");

  return `
    <section class="section join-tabs" data-join-tabs>
      <div class="join-tabs__list" role="tablist" aria-label="Join options">
        ${tabButtons}
      </div>
      ${visibleTabs.map(renderJoinTabPanel).join("")}
    </section>
  `;
}

function renderJoinTabPanel(tab, index) {
  const heading = value(tab.heading);
  const intro = value(tab.intro);
  const cards = toArray(tab.cards).map(renderCard).filter(Boolean);
  const gridClass = cards.length === 1 ? "grid--one" : "grid--two";
  const application = renderJoinApplication(tab.application);
  const faq = renderJoinFaq(tab.faq);

  if (!heading && !intro && !cards.length && !application && !faq) {
    return "";
  }

  return `
    <article
      class="join-tabs__panel"
      id="join-panel-${attr(tab.tabId)}"
      role="tabpanel"
      aria-labelledby="join-tab-${attr(tab.tabId)}"
      ${index === 0 ? "" : "hidden"}
    >
      ${renderSectionHeader(heading, intro)}
      ${cards.length ? `<div class="grid ${attr(gridClass)}">${cards.join("")}</div>` : ""}
      ${application}
      ${faq}
    </article>
  `;
}

function renderJoinApplication(application) {
  if (!application) {
    return "";
  }

  const formAction = getJoinFormAction({ application });
  const applicationPanel = value(application.title) || value(application.text) || formAction
    ? `<div class="section__cta">
        ${value(application.title) || value(application.text)
      ? `<div>
              ${value(application.title) ? `<h3>${html(application.title)}</h3>` : ""}
              ${value(application.text) ? `<p>${html(application.text)}</p>` : ""}
            </div>`
      : ""}
        ${formAction}
      </div>`
    : "";

  if (!value(application.heading) && !value(application.intro) && !applicationPanel) {
    return "";
  }

  return `
    <div class="join-tabs__block">
      ${renderSectionHeader(application.heading, application.intro)}
      ${applicationPanel}
    </div>
  `;
}

function renderJoinFaq(faq) {
  if (!faq) {
    return "";
  }

  const items = toArray(faq.items).map(renderFaqCard).filter(Boolean);

  if (!value(faq.heading) && !value(faq.intro) && !items.length) {
    return "";
  }

  return `
    <div class="join-tabs__block">
      ${renderSectionHeader(faq.heading, faq.intro)}
      ${items.length ? `<div class="grid grid--two">${items.join("")}</div>` : ""}
    </div>
  `;
}

function renderPageHeading(data) {
  const title = value(data.title);
  const heading = value(data.heading);
  const intro = value(data.intro);

  if (!title && !heading && !intro) {
    return "";
  }

  return `
    <section class="page-heading">
      ${title ? `<p class="eyebrow">${html(title)}</p>` : ""}
      ${heading ? `<h1>${html(heading)}</h1>` : ""}
      ${intro ? `<p>${html(intro)}</p>` : ""}
    </section>
  `;
}

function renderSectionHeader(heading, intro) {
  if (!value(heading) && !value(intro)) {
    return "";
  }

  return `
    <div class="section__header">
      <div>
        ${value(heading) ? `<h2>${html(heading)}</h2>` : ""}
        ${value(intro) ? `<p>${html(intro)}</p>` : ""}
      </div>
    </div>
  `;
}

function renderCardSection({ heading, intro, cards, gridClass, cardRenderer = renderCard }) {
  const visibleCards = toArray(cards).map(cardRenderer).filter(Boolean);

  if (!value(heading) && !value(intro) && !visibleCards.length) {
    return "";
  }

  return `
    <section class="section">
      ${renderSectionHeader(heading, intro)}
      ${visibleCards.length ? `<div class="grid ${attr(gridClass || "grid--two")}">${visibleCards.join("")}</div>` : ""}
    </section>
  `;
}

function renderAffiliationSection({ heading, intro, cards, gridClass, logo, logoAlt, url }) {
  const visibleCards = toArray(cards).map(renderCard).filter(Boolean);
  const headingText = value(heading);
  const introText = value(intro);
  const logoPath = value(logo);
  const linkUrl = value(url);

  if (!headingText && !introText && !visibleCards.length && !logoPath) {
    return "";
  }

  const formattedIntro = linkUrl && introText
    ? html(introText).replace(/ACM-W Asia Pacific/g, `<a href="${attr(linkUrl)}" target="_blank" rel="noopener noreferrer" class="link--text">ACM-W Asia Pacific</a>`)
    : html(introText);

  return `
    <section class="section section--affiliation">
      ${headingText ? renderSectionHeader(headingText, "") : ""}
      ${introText || logoPath
      ? `<div class="affiliation">
            ${introText ? `<p>${formattedIntro}</p>` : ""}
            ${logoPath
        ? `<div class="affiliation-logo">
                  ${linkUrl ? `<a href="${attr(linkUrl)}" target="_blank" rel="noopener noreferrer">` : ""}
                    <img src="${attr(getAssetHref(logoPath))}" alt="${attr(logoAlt)}" loading="lazy" decoding="async">
                  ${linkUrl ? `</a>` : ""}
                </div>`
        : ""}
          </div>`
      : ""}
      ${visibleCards.length ? `<div class="grid ${attr(gridClass || "grid--two")}">${visibleCards.join("")}</div>` : ""}
    </section>
  `;
}

function renderPillarSection({ heading, intro, items }) {
  return renderCardSection({
    heading,
    intro,
    cards: items,
    gridClass: "grid--three",
    cardRenderer: renderPillar,
  });
}

function renderEventSection({ heading, intro, events, emptyState }) {
  const visibleEvents = toArray(events).map(renderEvent).filter(Boolean);
  const hasHeader = value(heading) || value(intro);

  if (!hasHeader && !visibleEvents.length && !value(emptyState)) {
    return "";
  }

  return `
    <section class="section">
      ${renderSectionHeader(heading, intro)}
      ${visibleEvents.length
      ? `<div class="event-list">${visibleEvents.join("")}</div>`
      : renderUtilityNote(emptyState)}
    </section>
  `;
}

function renderCallout(callout) {
  if (!callout) {
    return "";
  }

  const actions = renderActionRow(callout.actions, "section__actions");
  const heading = value(callout.heading);
  const text = value(callout.text);

  if (!heading && !text && !actions) {
    return "";
  }

  return `
    <section class="section section--plain">
      <div class="section__cta">
        ${heading || text
      ? `<div>
              ${heading ? `<h2>${html(heading)}</h2>` : ""}
              ${text ? `<p>${html(text)}</p>` : ""}
            </div>`
      : ""}
        ${actions}
      </div>
    </section>
  `;
}

function renderCard(item) {
  const title = value(item?.title);
  const textContent = value(item?.text);

  if (!title && !textContent) {
    return "";
  }

  return `<article class="card">${title ? `<h3>${html(title)}</h3>` : ""}${textContent ? `<p>${html(textContent)}</p>` : ""}</article>`;
}

function renderFaqCard(item) {
  const question = value(item?.question);
  const answer = value(item?.answer);

  if (!question && !answer) {
    return "";
  }

  return `<article class="card card--soft">${question ? `<h3>${html(question)}</h3>` : ""}${answer ? `<p>${html(answer)}</p>` : ""}</article>`;
}

function renderPillar(item) {
  const title = value(item?.title);
  const textContent = value(item?.text);

  if (!title && !textContent) {
    return "";
  }

  return `<article class="card card--soft">${title ? `<div class="card__meta">${html(title)}</div>` : ""}${textContent ? `<p>${html(textContent)}</p>` : ""}</article>`;
}

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderMember(member) {
  const name = value(member?.name);
  const role = value(member?.role || member?.title);
  const initials = value(member?.initials) || getInitials(name);
  const summary = value(member?.summary || member?.bio || member?.description);
  const photo = value(member?.photo || member?.image || member?.avatar);

  if (!name && !role && !initials && !summary) {
    return "";
  }

  const avatarMarkup = photo
    ? `<img class="team-member__photo" src="${attr(getAssetHref(photo))}" alt="${attr(name)}" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" /><div class="team-member__avatar-fallback" style="display:none">${html(initials)}</div>`
    : `<div class="team-member__avatar-fallback">${html(initials)}</div>`;

  return `
    <div class="team-member">
      <div class="team-member__photo-wrapper">
        ${avatarMarkup}
      </div>
      ${name ? `<h3 class="team-member__name">${html(name)}</h3>` : ""}
      ${role ? `<div class="team-member__role">${html(role)}</div>` : ""}
      ${summary ? `<p class="team-member__summary">${html(summary)}</p>` : ""}
    </div>
  `;
}

function renderEvent(event) {
  const dateStr = value(event?.displayDate || event?.date);
  const timeStr = formatTo24HourTime(value(event?.displayTime || event?.time));
  const venueStr = value(event?.venue || event?.location);
  const title = value(event?.title);
  const summary = value(event?.summary || event?.description);
  const poster = value(event?.poster || event?.image);
  const eventId = event?.id || getStableId(title);
  const detailUrl = `${getPageHref("event")}?id=${encodeURIComponent(eventId)}`;

  if (!dateStr && !title && !summary && !poster) {
    return "";
  }

  const now = new Date();
  const timeBoundaryStr = event?.endDate || event?.startDate;
  const isPast = timeBoundaryStr && !isNaN(new Date(timeBoundaryStr).getTime()) && new Date(timeBoundaryStr) < now;
  const gallery = toArray(event?.gallery);
  const displayImage = isPast && gallery.length ? gallery[0] : (event?.poster || event?.image);
  const imagePath = displayImage ? getAssetHref(displayImage) : "";

  return `
    <article class="event${imagePath ? " event--has-poster" : ""}">
      ${imagePath
      ? `<div class="event__poster-box">
            <a href="${attr(detailUrl)}" title="View event details">
              <img class="event__poster-img" src="${attr(imagePath)}" alt="${attr(title || "Event thumbnail")}" loading="lazy" decoding="async">
            </a>
           </div>`
      : ""}
      <div class="event__details">
        <div class="event__header-meta">
          ${dateStr ? `<span class="event__date-badge"><svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${html(dateStr)}${timeStr && !isPast ? ` · ${html(timeStr)}` : ""}</span>` : ""}
          ${venueStr ? `<span class="event__venue-badge"><svg class="icon-svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${html(venueStr)}</span>` : ""}
        </div>
        ${title ? `<h3 class="event__title"><a href="${attr(detailUrl)}">${html(title)}</a></h3>` : ""}
        ${summary ? `<p class="event__summary">${html(summary)}</p>` : ""}
        <div class="event__footer-row">
          <div class="event__actions">
            <a class="button button--secondary button--sm" href="${attr(detailUrl)}">View Details</a>
            ${event?.signUpUrl && !isPast ? `<a class="button button--primary button--sm" href="${attr(event.signUpUrl)}" target="_blank" rel="noreferrer">Sign Up</a>` : ""}
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderActionRow(actions, className) {
  const buttons = toArray(actions).map(renderButton).filter(Boolean);

  if (!buttons.length) {
    return "";
  }

  return `<div class="${attr(className)}">${buttons.join("")}</div>`;
}

function renderButton(action) {
  const label = value(action?.label);
  const href = getLinkHref(action);

  if (!label || !href) {
    return "";
  }

  const variant = action.variant === "primary" ? "primary" : "secondary";
  const external = isExternalHref(href);
  return `<a class="button button--${variant}" href="${attr(href)}" ${external ? 'target="_blank" rel="noreferrer"' : ""}>${html(label)}</a>`;
}

function getJoinFormAction(data) {
  const application = data.application || {};
  const url = value(application.formUrl || data.formUrl);
  const label = value(application.formButtonLabel || data.formButtonLabel);

  if (!url || !label) {
    return "";
  }

  return renderButton({
    label,
    href: url,
    variant: application.formButtonVariant || "primary",
  });
}

function renderUtilityNote(message) {
  return value(message) ? `<div class="utility-note">${html(message)}</div>` : "";
}

function initializeJoinTabs(container) {
  container.querySelectorAll("[data-join-tabs]").forEach((tabsRoot) => {
    const tabs = Array.from(tabsRoot.querySelectorAll("[data-join-tab]"));
    const panels = Array.from(tabsRoot.querySelectorAll("[role='tabpanel']"));

    const activateTab = (activeTab) => {
      const activeId = activeTab.dataset.joinTab;

      tabs.forEach((tab) => {
        const selected = tab === activeTab;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.setAttribute("tabindex", selected ? "0" : "-1");
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== `join-panel-${activeId}`;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        const nextKey = event.key === "ArrowRight" || event.key === "ArrowDown";
        const previousKey = event.key === "ArrowLeft" || event.key === "ArrowUp";

        if (!nextKey && !previousKey) {
          return;
        }

        event.preventDefault();
        const offset = nextKey ? 1 : -1;
        const nextTab = tabs[(index + offset + tabs.length) % tabs.length];
        nextTab.focus();
        activateTab(nextTab);
      });
    });
  });
}

function renderNotFoundPage() {
  return `
    <section class="section">
      ${renderUtilityNote(site.notFound?.message)}
    </section>
  `;
}

function updateDocumentMetadata(data) {
  const title = value(data?.title || site.chapter?.name);
  const description = value(data?.description || site.description);
  const favicon = value(site.chapter?.favicon || site.chapter?.logo);

  if (title) {
    document.title = title;
  }

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", description);
  }

  if (favicon) {
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = getAssetHref(favicon);
  }
}

function getLinkHref(link) {
  if (link?.page) {
    return getPageHref(link.page);
  }

  return value(link?.href);
}

function getPageHref(targetPage) {
  if (targetPage === "home") {
    return isHomePage ? "./" : "../";
  }

  return isHomePage ? `${targetPage}/` : `../${targetPage}/`;
}

function getAssetHref(assetPath) {
  if (!assetPath || /^(https?:|mailto:|tel:)/i.test(assetPath)) {
    return assetPath;
  }

  return isHomePage ? assetPath : `../${assetPath}`;
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}

function getStableId(item) {
  return value(item)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "tab";
}

function toArray(items) {
  return Array.isArray(items) ? items.filter(Boolean) : [];
}

function value(item) {
  return typeof item === "string" ? item.trim() : item ?? "";
}

function html(item) {
  return String(value(item)).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function attr(item) {
  return html(item);
}

function formatTo24HourTime(timeString) {
  if (!timeString) return "";
  return String(timeString).replace(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/gi, (match, hours, minutes, period) => {
    let h = parseInt(hours, 10);
    const p = period.toUpperCase();
    if (p === "PM" && h < 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minutes}`;
  });
}
