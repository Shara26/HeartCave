import { Link } from 'react-router-dom';

const UPDATED = 'June 20, 2026';
const CONTACT_EMAIL = 'support@heartcave.app'; // ← set to your real support address

const sections = [
  {
    h: '1. Who we are',
    body: [
      'HeartCave is an anonymous peer-support platform that connects people facing similar life challenges so they can support one another. This Privacy Policy explains what information we collect, how we use it, and the choices you have.',
      'HeartCave provides peer support only. It is not a healthcare provider and does not offer medical, psychological, or crisis services.',
    ],
  },
  {
    h: '2. Information we collect',
    body: ['We collect only what we need to run HeartCave and keep the community safe:'],
    list: [
      'Account details: your real name and email address, and a securely hashed password. We never store your password in plain text.',
      'Profile details: the struggles, interests, and age group you choose, plus your auto-generated anonymous handle (for example, BraveSoul27).',
      'Content you create: posts, comments, reactions, private messages, connection requests, ratings, reports, and feedback you submit.',
      'Technical data: authentication tokens, a session cookie, and basic server logs used to operate and secure the service.',
    ],
  },
  {
    h: '3. How we use your information',
    body: ['We use your information to:'],
    list: [
      'Create and secure your account and keep you signed in.',
      'Match you with compatible people based on shared struggles, interests, and age group.',
      'Operate the support feed, private chat, connection requests, and reputation features.',
      'Keep the community safe through automated and human moderation, reporting, and blocking.',
      'Send in-app notifications and, where you provide an email, respond to your feedback.',
    ],
  },
  {
    h: '4. Your anonymity',
    body: [
      'Anonymity is central to HeartCave. Other members only ever see your anonymous handle, avatar, age group, interests, struggles, badges, and kindness score. Your real name and email are never shown to other users and cannot be searched.',
      'A limited number of administrators can access your real identity solely to investigate reports, enforce our rules, and protect members. They do not use it for any other purpose.',
    ],
  },
  {
    h: '5. Cookies and tokens',
    body: [
      'We use a strictly necessary, httpOnly cookie to hold your refresh token and keep you signed in, along with a short-lived access token held in your browser. These are essential to authentication. We do not use advertising or third-party tracking cookies.',
    ],
  },
  {
    h: '6. How we share information',
    body: [
      'We do not sell your personal information. We share it only with service providers that help us run HeartCave — for example, our database hosting and the email service used to deliver feedback notifications — and only as needed to provide the service. We may also disclose information if required by law or to protect the safety of our members.',
    ],
  },
  {
    h: '7. Data retention and deletion',
    body: [
      'We keep your information for as long as your account is active. Certain safety records, such as moderation logs and reports, may be retained longer to protect the community. You may request deletion of your account and associated personal data by contacting us; some anonymized or safety-related records may be retained where permitted by law.',
    ],
  },
  {
    h: '8. How we protect your data',
    body: [
      'We hash passwords with bcrypt, transmit data over encrypted connections, screen messages through moderation before delivery, and restrict access to real identities. No online service can be perfectly secure, but we use reasonable safeguards to protect your information.',
    ],
  },
  {
    h: '9. Your rights',
    body: [
      'Depending on where you live, you may have the right to access, correct, export, or delete your personal data, and to object to certain processing. To exercise these rights, contact us using the details below, and we will respond in line with applicable law.',
    ],
  },
  {
    h: '10. Age requirement',
    body: [
      'HeartCave is intended for people aged 13 and older. If you are under the age of majority in your region, please use HeartCave only with the involvement of a parent or guardian. We do not knowingly collect information from children under 13 and will remove such information if we become aware of it.',
    ],
  },
  {
    h: '11. Not a crisis or medical service',
    body: [
      'HeartCave is peer support, not professional care. If you are in crisis or may be a danger to yourself or others, please contact your local emergency services or a crisis helpline immediately.',
    ],
  },
  {
    h: '12. Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time. When we make material changes, we will update the date above and, where appropriate, notify you in the app.',
    ],
  },
  {
    h: '13. Contact us',
    body: [
      `Questions about your privacy? Reach us through the in-app Feedback page or at ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-lavender-700">Privacy Policy</h1>
        <p className="mt-1 text-sm text-lavender-400">Last updated: {UPDATED}</p>
      </header>

      <div className="hc-card space-y-6 p-6 sm:p-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-bold text-lavender-700">{s.h}</h2>
            {s.body?.map((para, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-lavender-600">{para}</p>
            ))}
            {s.list && (
              <ul className="mt-2 space-y-1.5">
                {s.list.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-lavender-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blush-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="border-t border-lavender-100 pt-4 text-sm text-lavender-500">
          See also our{' '}
          <Link to="/terms" className="font-bold text-lavender-700 hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}