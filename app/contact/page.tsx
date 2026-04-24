import type { Metadata } from "next"
import Link from "next/link"

const contactEmail = "info@online2day.com"
const contactPhoneDisplay = "0333 050 6098"
const contactPhoneHref = "tel:03330506098"

export const metadata: Metadata = {
  title: "Contact | Online2Day",
  description:
    "Contact Online2Day to discuss websites, web apps, automation systems and digital infrastructure for your business.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.28em] text-white/50">
              Contact Online2Day
            </p>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let’s build something that gives your business an unfair advantage.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
              Whether you need a high-performance website, a bespoke web app,
              or an internal system that reduces admin and improves visibility,
              we can help you turn digital infrastructure into a commercial asset.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold">01</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Discuss the commercial objective.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold">02</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Identify the highest-impact system or website improvements.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-2xl font-semibold">03</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Build, launch, measure and improve.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/40">
                Direct contact
              </p>

              <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
                <p>
                  Phone:{" "}
                  <Link
                    href={contactPhoneHref}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    {contactPhoneDisplay}
                  </Link>
                </p>

                <p>
                  Email:{" "}
                  <Link
                    href={`mailto:${contactEmail}`}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    {contactEmail}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight">
                Start the conversation
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Send a short message and we’ll come back to you with the most
                sensible next step. You can also call us directly on{" "}
                <Link
                  href={contactPhoneHref}
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  {contactPhoneDisplay}
                </Link>
                .
              </p>
            </div>

            <form
              action={`https://formsubmit.co/${contactEmail}`}
              method="POST"
              className="space-y-5"
            >
              <input type="hidden" name="_subject" value="New Online2Day enquiry" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-white/80"
                >
                  What are you looking to improve?
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
                  placeholder="Tell us about the website, system, process or business challenge."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              >
                Send enquiry
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-sm leading-6 text-white/60">
              <p>
                Prefer to speak directly?{" "}
                <Link
                  href={contactPhoneHref}
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  {contactPhoneDisplay}
                </Link>
              </p>

              <p className="mt-2">
                Prefer email?{" "}
                <Link
                  href={`mailto:${contactEmail}`}
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  {contactEmail}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}