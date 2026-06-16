import type { ComponentType } from "react";
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  HeartPulse,
  Mic,
  FileLock2,
  ShieldAlert,
  Cookie,
} from "lucide-react";
import type { CardIconTone } from "@/components/ui/CardIcon";

/**
 * The single source of truth for RolDe's legal & safety documents (W0.2).
 * Consumed by BOTH the in-app versioned Legal & Safety surface (`(app)/legal`)
 * AND the PUBLIC `/policy/[slug]` pages linked from the login footer. One list,
 * two renderers — never duplicated.
 *
 * Roland's standing direction (2026-06-14): RolDe writes these to a real v1.0
 * itself — researched against UK law — rather than deferring to counsel. Documents
 * are upgraded to v1.0 ("In Force") ONE AT A TIME; the rest stay honestly marked
 * as drafts until their turn. `[to be added]` marks a fact only RolDe supplies
 * (company no., ICO reg, address, liability caps, named CSO). Section headings are
 * Title Case (APPROVALS §2.3); body copy is sentences.
 *
 * v1.0 so far: Privacy Policy. Next: Terms · DPA · Disclaimer · Safety · AUP ·
 * Cookies · Consent.
 */

export type LegalSection = {
  heading: string;
  body?: string;
  items?: string[];
};

export type LegalVersion = {
  v: string;
  date: string;
  status: "current" | "superseded" | "draft";
  intro: string;
  sections: LegalSection[];
};

export type LegalDoc = {
  key: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: CardIconTone;
  summary: string;
  versions: LegalVersion[];
};

export const STATUS_LABEL: Record<LegalVersion["status"], string> = {
  current: "In Force",
  superseded: "Superseded",
  draft: "Draft",
};

export const STATUS_PILL: Record<LegalVersion["status"], string> = {
  current: "bg-success/12 text-success",
  superseded: "bg-muted text-muted-foreground",
  draft: "bg-warning/12 text-warning",
};

export const LEGAL_DOCS: LegalDoc[] = [
  // ───────────────────────── Privacy (v1.0) ─────────────────────────
  {
    key: "privacy",
    title: "Privacy Policy & Data-Processing Notice",
    icon: ShieldCheck,
    tone: "info",
    summary:
      "How RolDe processes personal and special-category health data under UK GDPR & DPA 2018.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "RolDe is a clinical operating system supplied to healthcare clinics by RolDe Ltd. This notice explains how we handle personal data and is the version currently in force. Whose data it is decides how it works: for the patient data held in the system, your clinic is the data controller and RolDe is its data processor (see the Data Processing Agreement), so your clinic's own privacy notice governs how it uses patient data; for the data we hold about clinic staff and account holders, RolDe is the controller, and this notice governs it.",
        sections: [
          {
            heading: "Who We Are",
            body: "RolDe Ltd (company no. 17210556, registered in England & Wales; registered office 71–75 Shelton Street, Covent Garden, London WC2H 9JQ) operates the RolDe platform and is the controller of the account and staff data described below. Our registration with the Information Commissioner's Office is in progress (number to follow). For any data-protection question, or to reach our data protection contact, email privacy@rolde.app.",
          },
          {
            heading: "What This Notice Covers",
            body: "This notice covers the personal data RolDe holds as a controller — principally the data of clinic staff and account holders. For patient data, RolDe acts as a processor on each clinic's instructions; how a clinic uses patient data is governed by that clinic's own privacy notice and by our Data Processing Agreement.",
          },
          {
            heading: "The Data We Process",
            body: "We process two broad kinds of personal data:",
            items: [
              "Account & staff data (RolDe is the controller): name, work email, role, professional registration numbers (e.g. GMC / GDC / NMC / PIN where relevant), and the security data needed to sign you in and protect the account — login events, device and IP information, and the captcha challenge.",
              "Patient data (your clinic is the controller; we process it on the clinic's behalf): demographic and contact details, clinical records, results, correspondence and anything else the clinic records in RolDe. Most of this is special-category health data under UK GDPR Article 9.",
            ],
          },
          {
            heading: "Where We Get It",
            body: "We collect account and staff data from your clinic when it sets up users, from you when you use the service, and automatically when you sign in (for example device and security information). Patient data is entered by the clinic and its clinicians, or flows in from systems the clinic chooses to connect.",
          },
          {
            heading: "Controller & Processor Roles",
            body: "For patient data, your clinic decides why and how it is processed, so the clinic is the controller and RolDe is its processor, acting only on the clinic's documented instructions (see the Data Processing Agreement). For the account and staff data needed to run and secure the service, RolDe is the controller.",
          },
          {
            heading: "Why We Use Data, And Our Lawful Basis",
            body: "We use account and staff data to provide, maintain, secure and support the platform, to communicate with you about the service, and to meet our legal obligations. Our lawful bases are: performance of our contract with the clinic (UK GDPR Art. 6(1)(b)); our legitimate interests in operating and securing the platform and preventing misuse (Art. 6(1)(f)); and compliance with our legal obligations (Art. 6(1)(c)). For patient data, the clinic — as controller — sets the Article 6 basis and the Article 9 condition for special-category data; in healthcare this is commonly Art. 9(2)(h) (provision of health or social care) with the associated condition in Schedule 1 of the DPA 2018. RolDe never sells personal data, and never uses patient data for advertising.",
          },
          {
            heading: "Automated Decisions & AI",
            body: "RolDe uses AI to draft notes, letters and suggestions, but it does not make solely-automated decisions that produce legal or similarly significant effects: a qualified clinician always reviews and authorises clinical outputs, so there is meaningful human involvement at every step (UK GDPR Art. 22 / Art. 22A, as amended by the Data (Use and Access) Act 2025). We do not use patient data to train AI models without a separate lawful basis and the necessary consents.",
          },
          {
            heading: "Who We Share Data With",
            body: "We share data only as needed to run the service or to meet the law:",
            items: [
              "Sub-processors who help us deliver the platform — Supabase (database, authentication and storage, London / EU region), Vercel (hosting), and Cloudflare (the Turnstile captcha) — each bound by data-protection terms.",
              "Our professional advisers, and regulators or authorities, where we are legally required or permitted to disclose. We never sell personal data.",
            ],
          },
          {
            heading: "International Transfers",
            body: "We host data in the UK and EU wherever possible. Where any transfer outside the UK is necessary, we put an appropriate safeguard in place — such as the ICO's International Data Transfer Agreement, or the UK Addendum to the EU Standard Contractual Clauses — and satisfy ourselves the data remains adequately protected.",
          },
          {
            heading: "How Long We Keep It",
            body: "We keep account and staff data while the clinic's account is active and for a limited period afterwards to meet legal, accounting and security obligations, then delete or anonymise it. Patient data is retained and deleted according to the clinic's instructions and its own retention rules. On termination, we delete or return data as set out in the Data Processing Agreement.",
          },
          {
            heading: "How We Keep It Secure",
            body: "We protect data with encryption in transit and at rest, membership-derived access controls so a clinic only ever sees its own data, bot-protection and rate-limiting on sign-in, leaked-password protection, multi-factor authentication for privileged roles, and audit logging. No system is perfectly secure, but we take this seriously and improve it continually.",
          },
          {
            heading: "Your Rights",
            body: "You have the right to access your personal data and to ask us to rectify, erase, restrict or port it, and to object to certain processing; where we rely on consent you may withdraw it at any time; and you have the right not to be subject to a solely-automated decision with legal or similarly significant effects. To exercise any right over account or staff data, email privacy@rolde.app. For patient data, requests should be made to the clinic as the controller, and we will assist the clinic in responding.",
          },
          {
            heading: "How To Complain",
            body: "If you are unhappy with how we handle your personal data, please tell us first at privacy@rolde.app and we will respond within one month. You also have the right to complain to the Information Commissioner's Office (ico.org.uk; 0303 123 1113) — though we would welcome the chance to put things right with you first.",
          },
          {
            heading: "Cookies & Similar Technologies",
            body: "RolDe uses strictly-necessary storage only — your session, security tokens, and the sign-in captcha. We set no advertising or tracking cookies. Our Cookie & Processing Notice has the detail.",
          },
          {
            heading: "Children's Data",
            body: "Clinical records held in RolDe may include data about children, processed on the clinic's behalf; the clinic, as controller, is responsible for the lawful basis and any additional safeguards for children's data. The RolDe service itself is intended for clinic staff, not for use by children.",
          },
          {
            heading: "Changes To This Notice",
            body: "We keep this notice current and will publish any update here with a new version number and date, keeping superseded versions available so you can always see what applied on a given date.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Terms (v1.0) ─────────────────────────
  {
    key: "terms",
    title: "Terms Of Service",
    icon: FileText,
    tone: "neutral",
    summary: "The agreement governing each clinic's use of RolDe.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "These terms govern each clinic's use of RolDe, the clinical operating system provided by RolDe Ltd (company no. 17210556, registered in England & Wales; registered office 71–75 Shelton Street, Covent Garden, London WC2H 9JQ). By subscribing to or using RolDe, the clinic agrees to these terms. This is the version currently in force.",
        sections: [
          {
            heading: "The Agreement",
            body: "This agreement is between RolDe Ltd (\"RolDe\", \"we\", \"us\") and the clinic that subscribes to the service (the \"Clinic\", \"you\"). It incorporates, and should be read with, our Data Processing Agreement, Acceptable Use Policy, Clinical Disclaimer, Clinical Safety Statement and Privacy Policy.",
          },
          {
            heading: "The Service",
            body: "RolDe is a clinical operating system: software that helps a clinic run its operations and that drafts and surfaces information for clinicians to review. RolDe is decision-support — it does not make clinical decisions (see Clinical Responsibility below, and the Clinical Disclaimer).",
          },
          {
            heading: "Your Licence",
            body: "We grant the Clinic a non-exclusive, non-transferable, non-sublicensable right to access and use RolDe for its own healthcare operations during the subscription term, in line with these terms. All rights not expressly granted are reserved.",
          },
          {
            heading: "Accounts & Access",
            body: "The Clinic is responsible for its users and their activity, for keeping login credentials secure, for using the security features we provide (including multi-factor authentication where required), and for removing access promptly when a person leaves. The Clinic must ensure its users are appropriately qualified and authorised for what they do in RolDe.",
          },
          {
            heading: "Acceptable Use",
            body: "The Clinic and its users must comply with our Acceptable Use Policy. We may suspend access for a breach (see Suspension).",
          },
          {
            heading: "Clinical Responsibility",
            body: "RolDe drafts and surfaces information for a qualified clinician to review; the clinician makes every clinical decision, exercising their own professional judgement, and nothing is sent or actioned without clinician sign-off. The Clinic and its clinicians remain fully responsible for clinical decisions, records, prescriptions, communications and care delivered using RolDe (see the Clinical Disclaimer and Clinical Safety Statement).",
          },
          {
            heading: "Data Protection",
            body: "For patient data, the Clinic is the controller and RolDe is the processor under our Data Processing Agreement, which forms part of these terms. Each party complies with applicable data-protection law (UK GDPR and the DPA 2018).",
          },
          {
            heading: "Fees & Payments",
            body: "The Clinic pays the subscription fees agreed at sign-up, plus any applicable taxes (e.g. VAT). Fees are invoiced as agreed, and we may suspend access for non-payment after notice. Where patients pay the Clinic through RolDe, the Clinic uses its own payment gateway as merchant of record — RolDe facilitates the connection, takes 0% of patient payments, and never holds patient money.",
          },
          {
            heading: "Intellectual Property",
            body: "RolDe and its licensors retain all intellectual property rights in the platform, including improvements and any anonymised, aggregated insights derived without identifying the Clinic or any individual. The Clinic retains all rights in its own data; nothing here transfers ownership of Clinic or patient data to RolDe.",
          },
          {
            heading: "Confidentiality",
            body: "Each party will protect the other's confidential information with reasonable care and use it only to perform this agreement, except where disclosure is required by law. This does not apply to information that is or becomes public other than through a breach of this agreement.",
          },
          {
            heading: "Warranties & Disclaimers",
            body: "We will provide the service with reasonable skill and care. Beyond that, and to the extent permitted by law, the service is provided \"as is\": we do not warrant that it will be uninterrupted or error-free, and the Clinical Disclaimer applies to all clinical outputs. Nothing in this section limits the data-protection commitments in the Data Processing Agreement.",
          },
          {
            heading: "Liability",
            body: "Neither party limits any liability that cannot be limited by law — including liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot lawfully be excluded. Subject to that:",
            items: [
              "Neither party is liable for indirect or consequential loss, or for loss of profit, revenue, goodwill, anticipated savings, or loss of or corruption of data, arising from this agreement.",
              "Each party's total aggregate liability arising out of or in connection with this agreement in any 12-month period is capped at the greater of (a) the total fees paid by the Clinic to RolDe in the 12 months before the event giving rise to the claim, or (b) £25,000.",
              "The cap does not apply to the Clinic's obligation to pay fees, or to either party's liability for breach of its data-protection or confidentiality obligations, which are dealt with in the Data Processing Agreement and the sections above.",
            ],
          },
          {
            heading: "Term & Termination",
            body: "These terms apply for the subscription term and any renewals. Either party may terminate for a material breach that is not remedied within 30 days of notice, or immediately if the other becomes insolvent. On termination, the Clinic's access ends and we delete or return Clinic data as set out in the Data Processing Agreement.",
          },
          {
            heading: "Suspension",
            body: "We may suspend access (in whole or part) where reasonably necessary to protect the security or integrity of the service, to address a serious breach of these terms or the Acceptable Use Policy, or for non-payment after notice. We restore access once the issue is resolved.",
          },
          {
            heading: "Changes",
            body: "We may update the service and these terms from time to time. We will give reasonable notice of any material change to these terms and record each version in our Legal & Safety surface; continuing to use RolDe after a change takes effect means the Clinic accepts it.",
          },
          {
            heading: "General",
            body: "Neither party may assign this agreement without the other's consent, except to a group company or in connection with a sale of its business. These terms, with the documents they incorporate, are the entire agreement between the parties. A failure to enforce a term is not a waiver of it; if any term is unenforceable, the rest stand. Neither party is liable for failure caused by events beyond its reasonable control.",
          },
          {
            heading: "Governing Law & Jurisdiction",
            body: "These terms are governed by the laws of England & Wales, and the courts of England & Wales have exclusive jurisdiction over any dispute.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── DPA (v1.0) ─────────────────────────
  {
    key: "dpa",
    title: "Data Processing Agreement",
    icon: FileLock2,
    tone: "info",
    summary:
      "The contract governing how RolDe processes personal data on each clinic's behalf (UK GDPR Art. 28).",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This Data Processing Agreement (DPA) forms part of the agreement between the clinic (the controller) and RolDe Ltd (the processor; company no. 17210556, registered office 71–75 Shelton Street, Covent Garden, London WC2H 9JQ), and sets out the terms required by Article 28 of the UK GDPR. RolDe is a health-information-system provider: the clinic decides why and how patient data is processed, and RolDe processes it on the clinic's behalf to provide the platform. This is the version currently in force.",
        sections: [
          {
            heading: "Roles & Definitions",
            body: "The clinic is the controller and RolDe is the processor of the patient data processed in RolDe. Terms such as \"personal data\", \"special-category data\", \"processing\", \"controller\", \"processor\" and \"data subject\" have the meanings given in the UK GDPR. Where the clinic is itself a processor for a third party, references to the clinic as controller apply accordingly.",
          },
          {
            heading: "Scope & Details Of Processing",
            body: "As required by Article 28(3):",
            items: [
              "Subject-matter: RolDe's provision of the RolDe platform to the clinic.",
              "Duration: the term of the clinic's subscription, plus any wind-down period for return or deletion.",
              "Nature & purpose: hosting, storing, organising and processing personal data so the clinic can run its operations and care for its patients.",
              "Types of personal data: patient demographic and contact details, clinical records, results and correspondence (including special-category health data), and clinic staff account data.",
              "Categories of data subject: the clinic's patients, and its staff and account holders.",
            ],
          },
          {
            heading: "Processing On Documented Instructions",
            body: "RolDe processes personal data only on the clinic's documented instructions — which include using RolDe as configured by the clinic's Caretaker, and any transfer of data to a third country — unless required to do otherwise by law, in which case RolDe informs the clinic first unless the law prohibits it. RolDe tells the clinic if, in its opinion, an instruction would breach data-protection law.",
          },
          {
            heading: "Confidentiality",
            body: "RolDe ensures that everyone it authorises to process the personal data is bound by an appropriate duty of confidentiality.",
          },
          {
            heading: "Security Of Processing",
            body: "RolDe implements appropriate technical and organisational measures to ensure a level of security appropriate to the risk (Article 32) — including encryption in transit and at rest, membership-derived access controls, authentication safeguards (multi-factor authentication for privileged roles, bot-protection and rate-limiting on sign-in), audit logging, and resilience and recovery measures.",
          },
          {
            heading: "Sub-processors",
            body: "The clinic gives general authorisation for RolDe to engage sub-processors (currently Supabase — database, authentication, storage and transactional email; Vercel — hosting; Cloudflare — the sign-in captcha). RolDe gives notice of any intended addition or replacement and a reasonable chance to object, imposes data-protection terms on each sub-processor equivalent to those in this DPA, and remains liable for their performance.",
          },
          {
            heading: "Assisting With Data-Subject Rights",
            body: "Taking into account the nature of the processing, RolDe assists the clinic by appropriate technical and organisational measures, insofar as possible, to respond to requests from individuals exercising their data-protection rights.",
          },
          {
            heading: "Personal Data Breaches",
            body: "RolDe notifies the clinic without undue delay after becoming aware of a personal data breach affecting the clinic's data, and provides the information the clinic reasonably needs to meet its own notification obligations to the ICO and to affected individuals.",
          },
          {
            heading: "DPIAs & Prior Consultation",
            body: "RolDe assists the clinic — taking into account the nature of the processing and the information available to RolDe — with data protection impact assessments and any prior consultation with the ICO.",
          },
          {
            heading: "Return Or Deletion Of Data",
            body: "On termination of the service, RolDe deletes or returns all the clinic's personal data at the clinic's choice, and deletes existing copies unless the law requires it to keep them.",
          },
          {
            heading: "Audits & Information",
            body: "RolDe makes available to the clinic the information necessary to demonstrate compliance with Article 28, and allows for and contributes to audits and inspections conducted by the clinic or an auditor it mandates, subject to reasonable confidentiality and security arrangements.",
          },
          {
            heading: "International Transfers",
            body: "RolDe does not transfer the clinic's personal data outside the UK except on the clinic's instructions and with an appropriate transfer safeguard in place (such as the UK IDTA or the Addendum to the EU Standard Contractual Clauses).",
          },
          {
            heading: "The Clinic's Responsibilities",
            body: "As controller, the clinic is responsible for having a lawful basis and a valid Article 9 condition for the patient data it processes, for the accuracy and lawfulness of that data and of its instructions, for telling its patients how their data is used, and — where it deploys RolDe in England — for its own clinical-risk duties under DCB0160, including appointing a Clinical Safety Officer who is a registered clinician (who need not be the clinic's Caretaker).",
          },
          {
            heading: "Liability & Precedence",
            body: "Liability under this DPA is subject to the limits in the Terms of Service, except where the law does not allow those limits to apply to data-protection liabilities. If there is a conflict between this DPA and the Terms on a data-protection matter, this DPA prevails. This DPA is governed by the laws of England & Wales.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Clinical Disclaimer (v1.0) ─────────────────────────
  {
    key: "disclaimer",
    title: "Clinical Disclaimer",
    icon: AlertTriangle,
    tone: "warning",
    summary: "RolDe is decision-support — it never replaces clinician judgement.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This Clinical Disclaimer explains how RolDe supports — and never replaces — clinical judgement. It applies to every clinician and clinic using RolDe, and forms part of the Terms of Service. This is the version currently in force.",
        sections: [
          {
            heading: "Decision Support, Not A Decision-maker",
            body: "RolDe presents information and prepares drafts — notes, letters, summaries and suggestions — for a qualified clinician to review. Every clinical decision is made by the clinician, exercising their own professional judgement and knowledge.",
          },
          {
            heading: "Nothing Acts Without Clinician Authorisation",
            body: "RolDe drafts autonomously but sends nothing on its own. No note, letter, prescription, order or message is finalised, sent or actioned without the explicit sign-off of an authorised clinician.",
          },
          {
            heading: "Not A Substitute For Clinical Judgement",
            body: "RolDe does not provide medical advice or a diagnosis and is not a substitute for professional examination, clinical judgement, or the clinician's duty of care to the patient.",
          },
          {
            heading: "Review AI Output Carefully",
            body: "AI-generated drafts and suggestions can be incomplete, out of date, or plausible but wrong. Clinicians must read them critically against the patient's record and their own assessment before relying on or authorising anything, and must not defer their judgement to the system (automation bias).",
          },
          {
            heading: "Information Accuracy & Currency",
            body: "RolDe draws on the clinic's record and, where configured, external sources. That information may be incomplete or out of date; the clinician is responsible for verifying anything they rely on against the original source and the patient in front of them.",
          },
          {
            heading: "Safety Checks Are Aids, Not Guarantees",
            body: "Where RolDe shows allergy, interaction, dose or other clinical-safety prompts, these are decision aids that support — never replace — the clinician's own checks. The absence of a prompt is not confirmation that something is safe.",
          },
          {
            heading: "The Clinician's Professional Duties",
            body: "Using RolDe does not change a clinician's professional and regulatory duties — including those owed to their regulator (for example the GMC's Good Medical Practice or the NMC Code), their duty to keep accurate records, and their responsibility for any prescription, referral or communication they authorise.",
          },
          {
            heading: "Where Responsibility Lies",
            body: "The clinician and the clinic remain responsible for all clinical decisions, records, prescriptions and communications made using RolDe.",
          },
          {
            heading: "Regulatory Position",
            body: "RolDe is designed as clinician-in-the-loop decision support: the clinician always reviews the underlying information and exercises independent judgement, and RolDe is not intended to operate autonomously or to make clinical decisions on its own. Where any feature of RolDe meets the legal definition of a medical device, RolDe ensures it complies with the applicable UK medical-device regulation (UKCA / MHRA).",
          },
          {
            heading: "Not For Emergencies",
            body: "RolDe is not an emergency service and must not be relied on in an emergency. In an emergency, follow your local emergency procedures and contact the emergency services.",
          },
          {
            heading: "Part Of The Terms",
            body: "This disclaimer forms part of the Terms of Service. If there is any conflict between this disclaimer and another document on a clinical-responsibility matter, this disclaimer applies.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Clinical Safety (v1.0) ─────────────────────────
  {
    key: "safety",
    title: "Clinical Safety Statement",
    icon: HeartPulse,
    tone: "critical",
    summary:
      "Clinical risk management for health IT (England: DCB0129 / DCB0160).",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This statement sets out RolDe's approach to clinical risk management as the manufacturer of a health IT system used in England. It is the version currently in force, approved by RolDe's Clinical Safety Officer.",
        sections: [
          {
            heading: "The Standard We Follow",
            body: "As the manufacturer of clinical software supplied to clinics in England, RolDe applies DCB0129 — \"Clinical Risk Management: its Application in the Manufacture of Health IT Systems\" — across the product lifecycle.",
          },
          {
            heading: "Our Clinical Safety Officer",
            body: "RolDe's Clinical Safety Officer (CSO) is Dr Roland Manoj Jayasekhar (GMC 7537707), a registered clinician with current professional registration. The CSO holds authority over the clinical safety of the product, including the authority to require changes or to pause a release on safety grounds.",
          },
          {
            heading: "Clinical Safety Case & Hazard Log",
            body: "RolDe maintains a Clinical Safety Case Report and a Hazard Log: the safety case sets out how the product is made safe to use, and the hazard log records each clinical hazard with its likelihood, severity and the controls that mitigate it. Both are kept current as the product changes.",
          },
          {
            heading: "How We Manage Clinical Risk",
            body: "Across design, build and release we identify clinical hazards, assess their likelihood and severity, put controls in place to reduce the risk so far as reasonably practicable, and review whether those controls are working — overseen and signed off by the CSO.",
          },
          {
            heading: "Designed To Be Safe",
            body: "RolDe is built so a clinician is always in the loop: it drafts and surfaces information but never finalises, sends or actions anything without explicit clinician sign-off, it shows clinical-safety prompts clearly, and it keeps the source of information traceable so a clinician can check it.",
          },
          {
            heading: "Your DCB0160 Duty",
            body: "Deploying clinics have their own legal duty under DCB0160 to manage clinical risk locally — including appointing their own Clinical Safety Officer (a registered clinician, who need not be the clinic's Caretaker) and maintaining a local safety case. RolDe's DCB0129 compliance does not remove that duty; we provide our safety documentation to support your DCB0160 work.",
          },
          {
            heading: "Reporting A Safety Concern",
            body: "If you believe RolDe has caused or could cause patient harm, tell us straight away at safety@rolde.app — include what happened, when, and the patient or record involved (without sending more personal data than necessary). Clinicians should also follow their own local incident-reporting process.",
          },
          {
            heading: "How We Respond",
            body: "We triage clinical-safety reports as a priority, investigate, and act — putting in place a fix or interim mitigation, updating the hazard log, and telling affected clinics. Where the law requires, we also report to the relevant authority (for example the MHRA).",
          },
          {
            heading: "Safety Through Change",
            body: "Every change to RolDe is risk-assessed before release. Where a change is safety-relevant, we communicate the relevant guidance and any known issues to deploying clinics so their own safety case stays current.",
          },
          {
            heading: "Working Together On Safety",
            body: "Clinical safety is shared: RolDe makes the product safe to use (DCB0129) and the clinic deploys and uses it safely (DCB0160). We work with clinics to keep it that way.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Acceptable Use (v1.0) ─────────────────────────
  {
    key: "aup",
    title: "Acceptable Use Policy",
    icon: ShieldAlert,
    tone: "warning",
    summary:
      "What clinics and their team may and may not do on RolDe — keeping the platform safe and lawful.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This Acceptable Use Policy sets out the rules that keep RolDe safe, secure and lawful for every clinic that uses it. It applies to every clinic and every user, and forms part of the Terms of Service. This is the version currently in force.",
        sections: [
          {
            heading: "Who This Applies To",
            body: "Every clinic that subscribes to RolDe, and every person it gives access to — the Caretaker, clinicians and any other staff.",
          },
          {
            heading: "Permitted Use",
            body: "You may use RolDe for your clinic's legitimate healthcare operations and administration, within your licence and these policies.",
          },
          {
            heading: "Prohibited Conduct",
            body: "You must not:",
            items: [
              "Use RolDe for anything unlawful, harmful, fraudulent, discriminatory or abusive.",
              "Access, or try to access, any data or part of the platform you are not authorised to use.",
              "Attempt to breach, probe, scan or circumvent the platform's security, authentication or access controls.",
              "Scrape, reverse-engineer, decompile, copy, resell or sublicense the platform or its data.",
              "Introduce malware, or take any action that could overload, disrupt, degrade or damage the service or other users.",
              "Misrepresent your identity or role, or share an account or credentials with anyone else.",
            ],
          },
          {
            heading: "Account Security & Access",
            body: "Each clinic is responsible for who has access and what they can do. Keep credentials confidential, use multi-factor authentication where required, give each person their own account, remove access promptly when someone leaves, and report any suspected compromise to us at once.",
          },
          {
            heading: "Patient Data & Confidentiality",
            body: "Only access patient data you have a legitimate clinical or operational reason to see, and treat it with the confidentiality the law and your professional duty require. RolDe scopes each clinic to its own data, but the clinic is responsible for managing access within its team.",
          },
          {
            heading: "Data Accuracy & Lawful Basis",
            body: "Each clinic is responsible for the accuracy of the clinical data it records, and for having a lawful basis to process the personal data it puts into RolDe.",
          },
          {
            heading: "Security Issues & Responsible Disclosure",
            body: "If you discover a security vulnerability, report it privately to us at team@rolde.app and do not exploit it, access more data than needed to demonstrate it, or disclose it publicly before we have had a reasonable chance to fix it. We welcome good-faith reports.",
          },
          {
            heading: "Reporting Misuse",
            body: "If you become aware of misuse of RolDe by anyone, please tell us at team@rolde.app.",
          },
          {
            heading: "Consequences Of Breach",
            body: "We may suspend or terminate access for a breach of this policy, and will report unlawful activity to the relevant authorities where we are required or permitted to do so.",
          },
          {
            heading: "Changes",
            body: "We may update this policy from time to time and will record each version here; continued use after a change takes effect means you accept it.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Cookies (v1.0) ─────────────────────────
  {
    key: "cookies",
    title: "Cookie & Processing Notice",
    icon: Cookie,
    tone: "neutral",
    summary:
      "The cookies and similar technologies RolDe uses, and why — strictly-necessary only at launch.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This notice explains what RolDe stores on your device and why. It is the version currently in force, and reflects PECR and the Data (Use and Access) Act 2025, alongside the UK GDPR where personal data is involved.",
        sections: [
          {
            heading: "Our Position",
            body: "RolDe uses strictly-necessary storage only. We set no advertising or cross-site tracking cookies, and we will not set any non-essential cookie or similar technology without asking for your consent first.",
          },
          {
            heading: "What We Use, And Why",
            body: "We use only what is essential to a service you have asked for:",
            items: [
              "Your authenticated session — a secure cookie that keeps you signed in as you move around RolDe.",
              "Security tokens — to protect against cross-site request forgery and similar attacks.",
              "The Cloudflare Turnstile captcha — to tell humans from bots and protect sign-in from automated abuse.",
            ],
          },
          {
            heading: "Why There Is No Consent Banner",
            body: "Under PECR, storage that is strictly necessary to provide a service the user has requested is exempt from the consent requirement. Everything above is essential to signing you in and keeping the service secure, so it does not require a cookie banner.",
          },
          {
            heading: "What We Do Not Use",
            body: "We do not use analytics, advertising, audience-measurement, fingerprinting or cross-site tracking technologies. We do not build profiles of you, and we do not share device or usage data with advertisers.",
          },
          {
            heading: "If We Ever Add Optional Cookies",
            body: "If we later introduce anything non-essential — for example product analytics — we will ask for your consent first, keep it switched off until you opt in, and let you change your mind at any time.",
          },
          {
            heading: "Third-party Technologies",
            body: "The only third-party technology involved above is Cloudflare's Turnstile captcha, used solely to tell humans from bots at sign-in. It is not used to track you across sites.",
          },
          {
            heading: "Controlling Your Cookies",
            body: "You can clear or block cookies in your browser settings. Blocking the strictly-necessary items above will stop sign-in and core features from working.",
          },
          {
            heading: "The Law",
            body: "This notice is given under the Privacy and Electronic Communications Regulations (PECR), as updated by the Data (Use and Access) Act 2025, and the UK GDPR where the storage involves personal data.",
          },
          {
            heading: "Changes To This Notice",
            body: "We keep this notice current and will publish any update here with a new version number and date.",
          },
        ],
      },
    ],
  },

  // ───────────────────────── Ambient-Capture Consent (v1.0) ─────────────────────────
  {
    key: "consent",
    title: "Ambient-Capture Consent",
    icon: Mic,
    tone: "success",
    summary:
      "Patient consent + a visible indicator before any dictation / ambient listening.",
    versions: [
      {
        v: "1.0",
        date: "2026-06-14",
        status: "current",
        intro:
          "This explains how RolDe handles consent before any AI dictation or ambient listening during a consultation. It is the version currently in force. A recording of a consultation is sensitive, so consent and control sit at the centre of how this works.",
        sections: [
          {
            heading: "When This Applies",
            body: "Only when a clinician chooses to use RolDe's dictation or ambient-listening features to help write the clinical note. RolDe does not record or listen at any other time, and never without the consent below.",
          },
          {
            heading: "Consent Comes First",
            body: "Before any capture begins, the patient gives explicit consent. RolDe records that consent — who gave it and when — and capture cannot start until it is given.",
          },
          {
            heading: "This Is Special-category Data",
            body: "A recording of a clinical consultation is special-category health data under UK GDPR Article 9. The clinic, as controller of patient data, processes it under its lawful basis and Article 9 condition; RolDe processes it only on the clinic's instructions.",
          },
          {
            heading: "What We Capture, And Only For That",
            body: "RolDe captures only the consultation audio, and only to help draft the clinician's note. It is not used to monitor staff, and capture is limited to what the clinician starts and stops.",
          },
          {
            heading: "A Visible Indicator",
            body: "Whenever RolDe is listening, a clear on-screen indicator shows that capture is active, so it is never hidden from the patient or the clinician.",
          },
          {
            heading: "Declining & Withdrawing",
            body: "The patient can decline, or withdraw consent at any time, and capture stops immediately. Declining or withdrawing does not affect the patient's care in any way.",
          },
          {
            heading: "Children & People Who Cannot Consent",
            body: "Where a patient cannot give consent themselves — for example a young child or someone who lacks capacity — consent is obtained from the person with parental responsibility or appropriate authority, in line with the clinician's professional duties.",
          },
          {
            heading: "What Happens To The Audio",
            body: "Captured audio is used to draft the clinician's note for review, then retained and deleted according to the clinic's instructions (see the Privacy Policy and Data Processing Agreement). It is never used for advertising, and never used to train AI models without a separate lawful basis and consent.",
          },
          {
            heading: "Who Does What",
            body: "The clinic is the controller and decides how consent and recordings are handled; RolDe is the processor and follows those instructions; and the clinician obtains and records the patient's consent before starting.",
          },
          {
            heading: "Clinician Responsibility",
            body: "The clinician confirms that the patient's consent has been obtained and recorded before starting capture, and remains responsible for using the feature appropriately.",
          },
        ],
      },
    ],
  },
];

export function getLegalDoc(key: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.key === key);
}
