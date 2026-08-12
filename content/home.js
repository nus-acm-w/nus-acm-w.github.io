import { site } from "./site.js?v=2";

export const homePage = {
  title: "Home",
  description: "Official website of NUS ACM-W Student Chapter at the National University of Singapore.",
  hero: {
    heading: "NUS ACM-W Student Chapter",
    intro: "Building a supportive, inclusive community for women and gender-diverse students in computing at the National University of Singapore.",
    image: "assets/images/acmw-singapore-student.png",
    imageAlt: "NUS ACM-W Chapter Logo",
    actions: [
      { label: "About Us", page: "about", variant: "primary" },
      { label: "Upcoming Events", page: "events", variant: "secondary" },
    ],
  },
  eventsPreview: {
    heading: "Upcoming events",
    emptyState: site.upcomingEventsEmptyState,
    limit: 2,
  },
};
