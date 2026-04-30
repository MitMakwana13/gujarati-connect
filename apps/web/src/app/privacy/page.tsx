import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-3 rounded-lg text-sm">
          <strong>Draft Note:</strong> This policy is a startup-safe draft pending review by legal counsel.
        </div>
      </div>

      <div className="space-y-6 text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Data:</strong> Email address, password (hashed), and display name.</li>
            <li><strong>Profile Data:</strong> Information you voluntarily provide, such as your bio, location, interests, and profile picture.</li>
            <li><strong>Platform Activity:</strong> Posts, comments, likes, event RSVPs, group memberships, and messages.</li>
            <li><strong>Technical Data:</strong> Cookies, session identifiers, and basic connection information used for security and authentication.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">How We Use Your Information</h2>
          <p>We use your information to operate the platform, authenticate your login (including email OTP), deliver community content, and communicate important updates. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Cookies and Sessions</h2>
          <p>We use secure, HTTP-only cookies to manage your login sessions. By using Gujarati Global, you consent to the use of these essential cookies.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-white">Data Deletion Requests</h2>
          <p>You can request the deletion of your account and associated data at any time by contacting support. See our <a href="/support" className="text-brand-saffron hover:underline">Support Page</a> for instructions.</p>
        </section>
      </div>
    </div>
  );
}
