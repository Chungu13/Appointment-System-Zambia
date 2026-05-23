const TEXT  = '#1a2e1c'
const MUTED = '#6b7c6d'
const PRIMARY = '#6B2737'

const OWNER_LINKS = ['How it Works', 'Pricing', 'For Businesses', 'Sign Up Free']
const OWNER_HREFS = ['/how-it-works', '/pricing', '/for-businesses', '/signup']

export default function LandingFooter() {
  return (
    <footer style={{ backgroundColor: '#eeeeee' }} className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <p className="font-display text-lg font-bold mb-2" style={{ color: TEXT }}>
              Kimawa
            </p>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              The AI-powered booking platform for Zambia's beauty industry.
            </p>
          </div>

          {/* For businesses */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY }}>
              For Businesses
            </p>
            <ul className="space-y-2">
              {OWNER_LINKS.map((link, i) => (
                <li key={link}>
                  <a
                    href={OWNER_HREFS[i]}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: MUTED }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* For customers */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: PRIMARY }}>
              For Customers
            </p>
            <ul className="space-y-2">
              <li>
                <a href="/discover" className="text-sm hover:underline" style={{ color: MUTED }}>
                  Find Beauty Services
                </a>
              </li>
              <li>
                <a href="/discover" className="text-sm hover:underline" style={{ color: MUTED }}>
                  Book an Appointment
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:underline" style={{ color: MUTED }}>
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:underline" style={{ color: MUTED }}>
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: '#ddd' }}>
          <p className="text-xs" style={{ color: MUTED }}>
            © 2025 Kimawa. Modern African Luxury.
          </p>
          <p className="text-xs" style={{ color: MUTED }}>
            Built for Zambia 🇿🇲
          </p>
        </div>
      </div>
    </footer>
  )
}
