import { Link } from "react-router-dom";

const links = [
    { label: "Safety & Support", to: "/safety" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
    { label: "Contact", to: "/contact" },
];

export default function Footer() {
    return (
        <footer className="bg-[#dceaf7] text-charcoal">
            <div className="mx-auto max-w-[90rem] px-6 pt-2 md:px-12">
                <div className="h-px bg-charcoal/10" />

                {/* Copyright + the few links that matter */}
                <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-[0.8125rem] text-charcoal/60">
                        © {new Date().getFullYear()} Comfort. All rights reserved.
                    </p>

                    <nav aria-label="Footer">
                        <ul className="flex flex-wrap gap-x-7 gap-y-2 text-[0.8125rem] text-charcoal/75">
                            {links.map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        className="transition-colors hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Honest expectations (PRD 4.6) */}
                <p className="mt-4 max-w-xl text-[0.75rem] leading-relaxed text-charcoal/55">
                    Comfort offers peer kindness and connection. It is not a substitute
                    for professional mental-health care or emergency assistance.
                </p>
            </div>

            {/* Wordmark */}
            <div
                aria-hidden
                className="mt-6 select-none overflow-hidden text-center md:mt-8"
            >
                <p className="-mb-[0.12em] text-[18.5vw] font-semibold leading-none tracking-[0.18em] text-[#c6daed]">
                    Comfort
                </p>
            </div>
        </footer>
    );
}