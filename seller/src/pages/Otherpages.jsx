// Analytics Page
import { MdTrendingUp, MdBarChart, MdConstruction } from 'react-icons/md';

export function Analytics() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Deep insights into your store performance</p>
      </div>
      <div className="card text-center py-16">
        <MdBarChart className="text-5xl text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">Analytics Coming Soon</p>
        <p className="text-gray-400 text-sm mt-1">Detailed sales analytics, customer insights, and trends will be available here.</p>
      </div>
    </div>
  );
}

// Support Page
export function Support() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Support</h1>
        <p className="text-gray-500 text-sm mt-0.5">Get help from the Zeedaddy team</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card hover:shadow-card-hover transition-all">
          <h3 className="font-semibold text-gray-900 mb-2">📧 Email Support</h3>
          <p className="text-sm text-gray-500 mb-3">Send us an email and we'll respond within 24 hours.</p>
          <a href="mailto:seller-support@zeedaddy.in" className="btn-primary text-sm inline-block">
            Email Us
          </a>
        </div>
        <div className="card hover:shadow-card-hover transition-all">
          <h3 className="font-semibold text-gray-900 mb-2">📋 FAQs</h3>
          <p className="text-sm text-gray-500 mb-3">Browse common questions about selling on Zeedaddy.</p>
          <a href="https://zeedaddy.in/faq" target="_blank" rel="noreferrer" className="btn-outline text-sm inline-block">
            View FAQs
          </a>
        </div>
        <div className="card sm:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-3">📝 Seller Guidelines</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="text-primary-500">✓</span> Products must have clear, accurate descriptions</li>
            <li className="flex gap-2"><span className="text-primary-500">✓</span> Images must be real product photos (no copyrighted images)</li>
            <li className="flex gap-2"><span className="text-primary-500">✓</span> Prices must be fair and transparent</li>
            <li className="flex gap-2"><span className="text-primary-500">✓</span> Ship orders within 2-3 business days</li>
            <li className="flex gap-2"><span className="text-primary-500">✓</span> Respond to customer queries within 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Settings Page
export function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences</p>
      </div>
      <div className="card">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Notification Preferences</h2>
        {[
          { label: 'New Order', desc: 'Get notified when you receive a new order' },
          { label: 'Order Status Update', desc: 'Notifications for order delivery updates' },
          { label: 'Payout Processed', desc: 'When your payout request is completed' },
          { label: 'Product Approved', desc: 'When admin approves your product listing' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}