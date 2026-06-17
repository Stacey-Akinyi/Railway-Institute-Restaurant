import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UtensilsCrossed, Clock, Wallet, BarChart3, Leaf, Users, ShieldCheck } from "lucide-react";

const SITE_URL = "https://railway-restaurant-management-system.lovable.app";
const PAGE_PATH = "/blog/benefits-of-canteen-management-systems";

export const Route = createFileRoute("/blog/benefits-of-canteen-management-systems")({
  head: () => ({
    meta: [
      { title: "Benefits of Canteen Management Systems — Complete Guide | RTI Canteen" },
      { name: "description", content: "Discover how canteen management systems improve efficiency, reduce food waste, and streamline payments in institutional dining. A complete guide for canteens and restaurants." },
      { property: "og:title", content: "Benefits of Canteen Management Systems — Complete Guide | RTI Canteen" },
      { property: "og:description", content: "Discover how canteen management systems improve efficiency, reduce food waste, and streamline payments in institutional dining." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: PAGE_PATH },
      { property: "og:site_name", content: "RTI Canteen" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "article:published_time", content: "2026-06-09" },
      { name: "article:section", content: "Food Technology" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}${PAGE_PATH}` },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Benefits of Canteen Management Systems — A Complete Guide",
          description: "Discover how canteen management systems improve efficiency, reduce food waste, and streamline payments in institutional dining.",
          url: `${SITE_URL}${PAGE_PATH}`,
          datePublished: "2026-06-09",
          author: {
            "@type": "Organization",
            name: "RTI Canteen",
            url: SITE_URL,
          },
          publisher: {
            "@type": "Organization",
            name: "RTI Canteen",
            url: SITE_URL,
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}${PAGE_PATH}`,
          },
        }),
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-navy transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </nav>

      <header className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-accent text-white text-xs font-semibold mb-4 uppercase tracking-wider">
          Guide
        </div>
        <h1 className="font-display text-4xl lg:text-5xl text-brand-navy leading-tight mb-4">
          Benefits of Canteen Management Systems
        </h1>
        <p className="text-lg text-muted-foreground">
          A complete guide to how automation is transforming institutional dining — from Railway Training Institute canteens to corporate cafeterias.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-brand-navy mb-4">What Is a Canteen Management System?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A canteen management system is a digital platform that handles ordering, payments, inventory, and customer engagement for institutional dining facilities. Whether you run a university cafeteria, a corporate kitchen, or a training institute canteen like RTI Canteen, the right system turns chaos into a streamlined, profitable operation.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Modern canteen management goes beyond a simple cash register. It connects online menus, table reservations, kitchen queues, payment gateways, and analytics into one cohesive experience.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-brand-navy mb-6">Key Benefits of Canteen Management Systems</h2>

        <div className="grid gap-6 mb-10">
          <BenefitCard
            icon={Clock}
            title="1. Improved Operational Efficiency"
            points={[
              "Digital ordering eliminates handwritten tickets and miscommunication between the counter and the kitchen.",
              "Real-time kitchen queues let staff prioritize dishes and estimate preparation times accurately.",
              "Automated table reservations reduce double-bookings and empty seats during peak hours.",
              "Staff spend less time on manual tasks and more time serving customers.",
            ]}
          />
          <BenefitCard
            icon={Leaf}
            title="2. Reduced Food Waste"
            points={[
              "Sales analytics reveal which menu items are popular and which sit unsold, guiding smarter purchasing.",
              "Pre-ordering features let kitchens prepare exact quantities instead of guessing demand.",
              "Real-time inventory tracking alerts you before ingredients expire, so nothing goes to waste.",
              "Waste dashboards help identify patterns and set reduction targets.",
            ]}
          />
          <BenefitCard
            icon={Wallet}
            title="3. Streamlined Payments"
            points={[
              "Multiple payment options — M-Pesa, cards, and cash — give customers flexibility and speed up checkout.",
              "Integrated digital wallets reduce cash-handling errors and shrinkage.",
              "Instant digital receipts and order history build trust with repeat diners.",
              "Reconciliation reports close the gap between sales and cash drawers automatically.",
            ]}
          />
          <BenefitCard
            icon={Users}
            title="4. Better Customer Experience"
            points={[
              "Online menus with photos and descriptions help diners decide before they reach the counter.",
              "Personalized profiles remember dietary preferences and past orders for faster reordering.",
              "Notifications when an order is ready reduce crowding around the pickup window.",
              "Table booking confirmations via SMS or email eliminate uncertainty for group dining.",
            ]}
          />
          <BenefitCard
            icon={BarChart3}
            title="5. Data-Driven Decision Making"
            points={[
              "Daily revenue, order volume, and peak-hour reports reveal trends invisible to the naked eye.",
              "Menu-item profitability analysis shows which dishes earn the most margin.",
              "Customer segmentation identifies frequent visitors and helps design loyalty rewards.",
              "Long-term analytics support seasonal menu planning and staffing schedules.",
            ]}
          />
          <BenefitCard
            icon={ShieldCheck}
            title="6. Enhanced Security & Accountability"
            points={[
              "Role-based access controls ensure only authorized staff can modify prices, inventory, or refunds.",
              "Audit trails for every transaction create accountability and simplify dispute resolution.",
              "Secure payment processing meets PCI-DSS and local mobile-money compliance standards.",
              "Digital records replace paper logs that can be lost, altered, or damaged.",
            ]}
          />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-brand-navy mb-4">How RTI Canteen Puts These Benefits into Practice</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          At the Railway Training Institute, the canteen serves hundreds of students, staff, and visitors every day. By adopting a modern management system, RTI Canteen has moved from manual processes to an automated platform that covers the full dining lifecycle:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Online menu browsing</strong> — Diners view breakfast, lunch, dinner, snacks, and drinks with live pricing before placing an order.</li>
          <li><strong>Cart-based checkout</strong> — Customers add items, choose dine-in or takeaway, and pay by their preferred method in seconds.</li>
          <li><strong>Table reservations</strong> — Groups and individuals book tables ahead of time for meetings, celebrations, or daily meals.</li>
          <li><strong>Kitchen queue management</strong> — Kitchen staff see incoming orders in real time with status updates from pending to ready.</li>
          <li><strong>Reception & walk-in support</strong> — Front-desk staff handle on-the-spot orders and payments without slowing down the line.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          The result is shorter wait times, happier customers, and a kitchen that runs like clockwork — even during the lunch rush.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-brand-navy mb-4">Who Should Invest in a Canteen Management System?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "University and college cafeterias",
            "Corporate office canteens",
            "Hospital and clinic dining facilities",
            "Training institute and hostel kitchens",
            "Factory and industrial site mess halls",
            "Event and conference center catering",
          ].map((item) => (
            <Card key={item} className="p-4 flex items-center gap-3">
              <UtensilsCrossed className="h-5 w-5 text-brand-orange shrink-0" />
              <span className="text-sm font-medium text-brand-navy">{item}</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-brand-navy mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <FaqItem
            question="What is the main purpose of a canteen management system?"
            answer="The main purpose is to digitize and automate all canteen operations — ordering, payments, inventory, reservations, and reporting — so that institutional dining runs more efficiently with less waste and better customer satisfaction."
          />
          <FaqItem
            question="How does a canteen management system reduce food waste?"
            answer="It reduces waste by tracking inventory in real time, analyzing which dishes sell best, and enabling pre-ordering so kitchens know exactly how much to prepare. Alerts for expiry dates also help staff use ingredients before they spoil."
          />
          <FaqItem
            question="Can a canteen management system handle multiple payment methods?"
            answer="Yes. Modern systems support cash, mobile money such as M-Pesa, debit and credit cards, and digital wallets. This flexibility speeds up checkout and improves the customer experience."
          />
          <FaqItem
            question="Is a canteen management system suitable for small canteens?"
            answer="Absolutely. Even small canteens benefit from faster ordering, accurate inventory counts, and simple sales reports. Many platforms scale from a single counter to multi-location operations."
          />
          <FaqItem
            question="What features should I look for in a canteen management system?"
            answer="Look for online menu display, digital ordering and payments, kitchen queue management, table reservations, inventory tracking, sales analytics, role-based access, and mobile-friendly design."
          />
        </div>
      </section>

      <section className="mb-12 bg-gradient-brand text-white rounded-xl p-8">
        <h2 className="font-display text-2xl text-brand-yellow mb-3">Ready to Upgrade Your Canteen?</h2>
        <p className="text-white/80 mb-6 leading-relaxed">
          Whether you manage a training institute, university, or corporate cafeteria, a modern canteen management system is the fastest way to cut costs, reduce waste, and keep your diners coming back.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="default" className="bg-brand-orange text-white hover:bg-brand-orange/90">
            <Link to="/menu">Browse RTI Canteen Menu</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
            <Link to="/reservations">Reserve a Table</Link>
          </Button>
        </div>
      </section>
    </article>
  );
}

function BenefitCard({ icon: Icon, title, points }: { icon: typeof Clock; title: string; points: string[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="font-display text-xl text-brand-navy">{title}</h3>
      </div>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="text-sm text-muted-foreground flex gap-2">
            <span className="text-brand-orange shrink-0">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h3 className="font-medium text-brand-navy mb-1">{question}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}
