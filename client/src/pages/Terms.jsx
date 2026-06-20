import { Link } from 'react-router-dom';

const UPDATED = 'June 20, 2026';
const CONTACT_EMAIL = 'support@heartcave.app'; // ← set to your real support address
const GOVERNING_LAW = 'India';                 // ← set to your jurisdiction

const sections = [
  {
    h: '1. Acceptance of these terms',
    body: [
      'By creating an account or using HeartCave, you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use HeartCave.',
    ],
  },
  {
    h: '2. Who can use HeartCave',
    body: [
      'You must be at least 13 years old to use HeartCave, and old enough to form a binding agreement in your region. By using HeartCave, you confirm that you meet these requirements and that the information you provide is accurate.',
    ],
  },
  {
    h: '3. Your account',
    body: [
      'You are responsible for keeping your login details secure and for activity that happens under your account. Tell us right away if you believe your account has been compromised. You may not impersonate anyone else or create an account on behalf of someone without permission.',
    ],
  },
  {
    h: '4. Anonymity and identity',
    body: [
      'HeartCave gives you an anonymous handle that other members see instead of your real name. You agree not to attempt to identify, locate, or expose other members, and not to share another person’s private information.',
    ],
  },
  {
    h: '5. Community guidelines',
    body: ['HeartCave exists to be a kind, safe space. When using it, you agree not to:'],
    list: [
      'Harass, bully, threaten, or abuse any member.',
      'Post sexual content involving minors, grooming, or any content that sexualizes children.',
      'Encourage self-harm or suicide, or share content that promotes harm to others.',
      'Post hateful content that targets people based on their identity.',
      'Spam, advertise, scam, or impersonate others.',
      'Share content that is illegal or that violates someone else’s rights.',
    ],
  },
  {
    h: '6. Your content',
    body: [
      'You keep ownership of the posts, comments, and messages you create. By sharing content on HeartCave, you grant us a limited licence to store, display, and process it solely to operate the service. You are responsible for the content you share and confirm you have the right to share it.',
    ],
  },
  {
    h: '7. Moderation and enforcement',
    body: [
      'To keep members safe, content may be screened by automated moderation before it is delivered, and reviewed by our team. We may warn, suspend, or permanently ban accounts that break these terms. Serious violations — such as threats, sexual misconduct, grooming, hate speech, or encouraging self-harm — may result in immediate removal without warning. You can report or block other members at any time.',
    ],
  },
  {
    h: '8. Not a substitute for professional help',
    body: [
      'HeartCave provides peer support only. It is not therapy, counseling, medical advice, or a crisis service, and our members are not professionals. If you are in crisis or in danger, contact your local emergency services or a crisis helpline immediately.',
    ],
  },
  {
    h: '9. Privacy',
    body: [
      'Your use of HeartCave is also governed by our Privacy Policy, which explains how we handle your information.',
    ],
  },
  {
    h: '10. Service provided “as is”',
    body: [
      'HeartCave is provided on an “as is” and “as available” basis without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free, or that matches or support will meet your expectations.',
    ],
  },
  {
    h: '11. Limitation of liability',
    body: [
      'To the fullest extent permitted by law, HeartCave and its team will not be liable for any indirect, incidental, or consequential damages arising from your use of the service or from interactions with other members.',
    ],
  },
  {
    h: '12. Suspension and termination',
    body: [
      'You may stop using HeartCave and request account deletion at any time. We may suspend or terminate access if you violate these terms or to protect the community.',
    ],
  },
  {
    h: '13. Changes to these terms',
    body: [
      'We may update these terms from time to time. When we make material changes, we will update the date above and, where appropriate, notify you in the app. Continued use after changes means you accept the updated terms.',
    ],
  },
  {
    h: '14. Governing law',
    body: [
      `These terms are governed by the laws of ${GOVERNING_LAW}, without regard to its conflict-of-law principles.`,
    ],
  },
  {
    h: '15. Contact us',
    body: [
      `Questions about these terms? Reach us through the in-app Feedback page or at ${CONTACT_EMAIL}.`,
    ],
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-lavender-700">Terms of Service</h1>
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
          <Link to="/privacy" className="font-bold text-lavender-700 hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}