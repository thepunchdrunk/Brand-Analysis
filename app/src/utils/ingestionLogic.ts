import { AssetType, CommunicationContext, AudienceScope } from '../types';

export enum InputMethod {
    FILE = 'Upload Files',
    TEXT = 'Paste Text'
}

export interface AssetOption {
    label: string;
    value: AssetType;
    context: CommunicationContext; // Implicit context mapping
}

// --- REFACTORED TAXONOMY (Function-First) ---

export const INTERNAL_ASSETS: Record<string, AssetOption[]> = {
    "HR & People (Culture)": [
        { label: 'Job Description', value: AssetType.JOB_DESC, context: CommunicationContext.HR },
        { label: 'Offer Letter', value: AssetType.OFFER_LETTER, context: CommunicationContext.HR },
        { label: 'Resume/CV', value: AssetType.RESUME, context: CommunicationContext.HR }, // New
        { label: 'Interview Notes', value: AssetType.INTERVIEW_NOTES, context: CommunicationContext.HR }, // New
        { label: 'Interview Recording', value: AssetType.INTERVIEW_REC, context: CommunicationContext.HR }, // New
        { label: 'HR Handbook/Guide', value: AssetType.HR_GUIDE, context: CommunicationContext.HR },
        { label: 'Performance Review', value: AssetType.PERF_REVIEW, context: CommunicationContext.HR },
        { label: 'Onboarding Video', value: AssetType.ONBOARDING_VIDEO, context: CommunicationContext.HR },
        { label: 'Training Video', value: AssetType.TRAINING_VIDEO, context: CommunicationContext.HR }, // New
        { label: 'Training/e-Learning', value: AssetType.ELEARNING, context: CommunicationContext.HR },
        { label: 'Internal Policy', value: AssetType.POLICY, context: CommunicationContext.HR },
        { label: 'Org Chart', value: AssetType.ORG_CHART, context: CommunicationContext.HR },
    ],
    "Corporate Strategy (Leadership)": [
        { label: 'Town Hall Deck', value: AssetType.TOWN_HALL, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Leadership Vlog', value: AssetType.LEADERSHIP_VLOG, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Corporate Update/Comm', value: AssetType.CORP_COMMS_VIDEO, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Strategic Memo', value: AssetType.MEMO, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Project Brief', value: AssetType.PROJECT_BRIEF, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Status Report', value: AssetType.STATUS_REPORT, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Project Report', value: AssetType.PROJECT_REPORT, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Internal Podcast', value: AssetType.INTERNAL_PODCAST, context: CommunicationContext.INTERNAL_OPS },
    ],
    "Operations, R&D & Technical": [
        { label: 'SOP / Process Flow', value: AssetType.SOP, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Meeting Minutes', value: AssetType.MEETING_MINUTES, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Research Paper', value: AssetType.RESEARCH_PAPER, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Tech / Process Explainer', value: AssetType.EXPLAINER_VIDEO, context: CommunicationContext.INTERNAL_OPS }, // New (Internal Explainer)
        { label: 'Diagram / Schematic', value: AssetType.DIAGRAM, context: CommunicationContext.INTERNAL_OPS }, // New
        { label: 'Tech Spec', value: AssetType.TECH_SPEC, context: CommunicationContext.INTERNAL_OPS },
        { label: 'API Documentation', value: AssetType.API_DOCS, context: CommunicationContext.INTERNAL_OPS },
        { label: 'Release Notes', value: AssetType.RELEASE_NOTES, context: CommunicationContext.INTERNAL_OPS },
        { label: 'White Paper (Internal)', value: AssetType.WHITE_PAPER, context: CommunicationContext.INTERNAL_OPS },
        { label: 'NDA', value: AssetType.NDA, context: CommunicationContext.LEGAL_COMPLIANCE },
        { label: 'Internal Meeting Rec', value: AssetType.MEETING_REC, context: CommunicationContext.INTERNAL_OPS },
    ],
    "General": [
        { label: 'Document', value: AssetType.DOCUMENT, context: CommunicationContext.NOT_SURE },
        { label: 'Presentation', value: AssetType.PRESENTATION, context: CommunicationContext.NOT_SURE },
        { label: 'Spreadsheet', value: AssetType.PRICE_LIST, context: CommunicationContext.NOT_SURE }, // Fallback using Price List or similar? No, strict fallback types.
        { label: 'Voice Note/Memo', value: AssetType.VOICE_MEMO, context: CommunicationContext.NOT_SURE }, // New
        { label: 'Video', value: AssetType.VIDEO, context: CommunicationContext.NOT_SURE },
        { label: 'Image', value: AssetType.IMAGE, context: CommunicationContext.NOT_SURE },
        { label: 'Audio', value: AssetType.AUDIO, context: CommunicationContext.NOT_SURE },
    ]
};

export const EXTERNAL_ASSETS: Record<string, AssetOption[]> = {
    "Marketing & Brand (Awareness)": [
        { label: 'Social Media Post', value: AssetType.SOCIAL_ASSET, context: CommunicationContext.MARKETING },
        { label: 'Ad Campaign', value: AssetType.AD_CAMPAIGN, context: CommunicationContext.MARKETING },
        { label: 'Brand Guidelines', value: AssetType.BRAND_GUIDELINES, context: CommunicationContext.MARKETING }, // New
        { label: 'Logo / Brand Asset', value: AssetType.LOGO, context: CommunicationContext.MARKETING }, // New
        { label: 'Web / Landing Page', value: AssetType.WEB_CONTENT, context: CommunicationContext.MARKETING },
        { label: 'Blog Post', value: AssetType.BLOG_POST, context: CommunicationContext.MARKETING },
        { label: 'Infographic', value: AssetType.INFOGRAPHIC, context: CommunicationContext.MARKETING },
        { label: 'Event Recap', value: AssetType.EVENT_RECAP, context: CommunicationContext.MARKETING }, // New
        { label: 'Explainer Video', value: AssetType.EXPLAINER_VIDEO, context: CommunicationContext.MARKETING }, // New
        { label: 'E-Book', value: AssetType.EBOOK, context: CommunicationContext.MARKETING },
        { label: 'Email/Newsletter', value: AssetType.NEWSLETTER, context: CommunicationContext.MARKETING },
        { label: 'TV/Video Spot', value: AssetType.TV_SPOT, context: CommunicationContext.MARKETING },
    ],
    "Sales & Commercial (Conversion)": [
        { label: 'Pitch Deck', value: AssetType.PITCH_DECK, context: CommunicationContext.SALES },
        { label: 'One-Pager', value: AssetType.ONE_PAGER, context: CommunicationContext.SALES }, // New
        { label: 'Proposal / RFP', value: AssetType.PROPOSAL, context: CommunicationContext.SALES },
        { label: 'Battlecard', value: AssetType.BATTLECARD, context: CommunicationContext.SALES },
        { label: 'Customer Case Study', value: AssetType.CASE_STUDY, context: CommunicationContext.SALES },
        { label: 'Sales Script', value: AssetType.SALES_SCRIPT, context: CommunicationContext.SALES },
        { label: 'Email Template', value: AssetType.EMAIL_TEMPLATE, context: CommunicationContext.SALES },
        { label: 'Product Demo', value: AssetType.PRODUCT_DEMO, context: CommunicationContext.SALES },
        { label: 'Contract / SOW', value: AssetType.CONTRACT, context: CommunicationContext.SALES },
        { label: 'Price List', value: AssetType.PRICE_LIST, context: CommunicationContext.SALES },
    ],
    "Corporate Affairs & Support": [
        { label: 'Press Release', value: AssetType.PRESS_RELEASE, context: CommunicationContext.MARKETING },
        { label: 'Annual Report', value: AssetType.ANNUAL_REPORT, context: CommunicationContext.MARKETING },
        { label: 'User Guide / Manual', value: AssetType.USER_GUIDE, context: CommunicationContext.SALES },
        { label: 'Privacy Policy', value: AssetType.PRIVACY_POLICY, context: CommunicationContext.LEGAL_COMPLIANCE },
        { label: 'Terms of Service', value: AssetType.TERMS, context: CommunicationContext.LEGAL_COMPLIANCE },
        { label: 'MSA', value: AssetType.MSA, context: CommunicationContext.LEGAL_COMPLIANCE },
        { label: 'Crisis Statement', value: AssetType.CRISIS_STATEMENT, context: CommunicationContext.LEGAL_COMPLIANCE },
        { label: 'Reseller Kit', value: AssetType.RESELLER_KIT, context: CommunicationContext.SALES },
    ],
    "General": [
        { label: 'Document', value: AssetType.DOCUMENT, context: CommunicationContext.NOT_SURE },
        { label: 'Presentation', value: AssetType.PRESENTATION, context: CommunicationContext.NOT_SURE },
        { label: 'Video', value: AssetType.VIDEO, context: CommunicationContext.NOT_SURE },
        { label: 'Image', value: AssetType.IMAGE, context: CommunicationContext.NOT_SURE },
        { label: 'Audio', value: AssetType.AUDIO, context: CommunicationContext.NOT_SURE },
    ]
};

// --- FORMAT COMPATIBILITY MAP ---
// Defines which asset types are valid for which physical file format categories.
// Categories: DOC (Docs/PDF), PRES (PPTX), VIDEO (MP4/MOV), IMAGE (JPG/PNG), AUDIO (MP3/WAV)

const FORMAT_COMPATIBILITY: Record<string, Set<AssetType>> = {
    DOC: new Set([
        AssetType.HR_GUIDE, AssetType.POLICY, AssetType.MEMO, AssetType.PROJECT_REPORT,
        AssetType.SOP, AssetType.TECH_SPEC, AssetType.WHITE_PAPER, AssetType.WEB_CONTENT,
        AssetType.BLOG_POST, AssetType.NEWSLETTER, AssetType.PROPOSAL, AssetType.CASE_STUDY,
        AssetType.CONTRACT, AssetType.PRICE_LIST, AssetType.PRESS_RELEASE, AssetType.ANNUAL_REPORT,
        AssetType.USER_GUIDE, AssetType.CRISIS_STATEMENT, AssetType.RESELLER_KIT,
        AssetType.WHITE_PAPER_EXT,
        // New
        AssetType.JOB_DESC, AssetType.OFFER_LETTER, AssetType.PERF_REVIEW,
        AssetType.NDA, AssetType.MSA, AssetType.PRIVACY_POLICY, AssetType.TERMS,
        AssetType.BATTLECARD, AssetType.SALES_SCRIPT, AssetType.EMAIL_TEMPLATE,
        AssetType.EBOOK, AssetType.API_DOCS, AssetType.RELEASE_NOTES,
        AssetType.RESUME, AssetType.INTERVIEW_NOTES, AssetType.MEETING_MINUTES,
        AssetType.PROJECT_BRIEF, AssetType.STATUS_REPORT, AssetType.RESEARCH_PAPER,
        AssetType.ONE_PAGER, AssetType.BRAND_GUIDELINES, // Often PDFs
        // Generic
        AssetType.DOCUMENT, AssetType.PRESENTATION // PDF often used for presentations
    ]),
    PRES: new Set([
        AssetType.ELEARNING, AssetType.TOWN_HALL, AssetType.PROJECT_REPORT,
        AssetType.PITCH_DECK, AssetType.PROPOSAL, AssetType.RESELLER_KIT, AssetType.ORG_CHART,
        AssetType.BATTLECARD, AssetType.INFOGRAPHIC,
        // New
        AssetType.BRAND_GUIDELINES, AssetType.STATUS_REPORT, AssetType.PROJECT_BRIEF,
        // Generic
        AssetType.PRESENTATION
    ]),
    VIDEO: new Set([
        AssetType.ONBOARDING_VIDEO, AssetType.TRAINING_SLIDES,
        AssetType.LEADERSHIP_VLOG, AssetType.MEETING_REC, AssetType.ELEARNING,
        AssetType.SOCIAL_ASSET, AssetType.AD_CAMPAIGN, AssetType.TV_SPOT,
        AssetType.PRODUCT_DEMO, AssetType.WEBINAR, AssetType.TESTIMONIAL,
        AssetType.INTERNAL_PODCAST, // Video podcast
        // New
        AssetType.EXPLAINER_VIDEO, AssetType.TRAINING_VIDEO, AssetType.CORP_COMMS_VIDEO,
        AssetType.EVENT_RECAP, AssetType.INTERVIEW_REC,
        // Generic
        AssetType.VIDEO
    ]),
    IMAGE: new Set([
        AssetType.ORG_CHART, AssetType.SOCIAL_ASSET, AssetType.AD_CAMPAIGN,
        AssetType.WEB_CONTENT, AssetType.POSTER, AssetType.INFOGRAPHIC,
        // New
        AssetType.LOGO, AssetType.DIAGRAM, AssetType.EVENT_RECAP, AssetType.ONE_PAGER,
        // Generic
        AssetType.IMAGE
    ]),
    AUDIO: new Set([
        AssetType.MEETING_REC, AssetType.INTERNAL_PODCAST, AssetType.LEADERSHIP_VLOG, // Vlog audio only?
        // New
        AssetType.VOICE_MEMO, AssetType.INTERVIEW_REC,
        // Generic
        AssetType.AUDIO
    ])
};

// Filter logic for Text Input mode
export const TEXT_ONLY_TYPES = new Set([
    AssetType.SOP, AssetType.POLICY, AssetType.MEMO, AssetType.TECH_SPEC, AssetType.HR_GUIDE, AssetType.WHITE_PAPER,
    AssetType.AD_CAMPAIGN, AssetType.SOCIAL_ASSET, AssetType.WEB_CONTENT, AssetType.PRESS_RELEASE, AssetType.NEWSLETTER,
    AssetType.BLOG_POST, AssetType.CASE_STUDY, AssetType.PROPOSAL, AssetType.CRISIS_STATEMENT,
    // New
    AssetType.JOB_DESC, AssetType.NDA, AssetType.MSA, AssetType.PRIVACY_POLICY, AssetType.TERMS,
    AssetType.SALES_SCRIPT, AssetType.EMAIL_TEMPLATE, AssetType.RELEASE_NOTES,
    AssetType.DOCUMENT, AssetType.PRESENTATION, AssetType.USER_GUIDE
]);

export function getAvailableAssets(scope: AudienceScope | null, inputMethod: InputMethod, fileName?: string): Record<string, AssetOption[]> {
    const source = scope === AudienceScope.INTERNAL ? INTERNAL_ASSETS : EXTERNAL_ASSETS;

    // Detect Format Category from Extension
    let formatCategory = 'DOC'; // Default fallback
    if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['ppt', 'pptx'].includes(ext || '')) formatCategory = 'PRES';
        else if (['mp4', 'mov', 'avi', 'kv', 'webm', 'mkv'].includes(ext || '')) formatCategory = 'VIDEO';
        else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) formatCategory = 'IMAGE';
        else if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext || '')) formatCategory = 'AUDIO';
        // PDF, DOC, DOCX default to DOC
    }

    // Deep copy to avoid mutating source
    const result: Record<string, AssetOption[]> = {};

    for (const [category, items] of Object.entries(source)) {
        const filtered = items.filter(item => {
            if (inputMethod === InputMethod.TEXT) {
                // Show ONLY Text Types
                return TEXT_ONLY_TYPES.has(item.value);
            }

            // Upload Files: Filter by strict format compatibility if file provided
            if (fileName && formatCategory) {
                const allowedSet = FORMAT_COMPATIBILITY[formatCategory];
                return allowedSet ? allowedSet.has(item.value) : true;
            }

            return true;
        });

        if (filtered.length > 0) {
            result[category] = filtered;
        }
    }

    return result;
}

export function inferContextFromAssetType(type: AssetType): CommunicationContext {
    // Search in both sets
    for (const cat of Object.values(INTERNAL_ASSETS)) {
        const found = cat.find(a => a.value === type);
        if (found) return found.context;
    }
    for (const cat of Object.values(EXTERNAL_ASSETS)) {
        const found = cat.find(a => a.value === type);
        if (found) return found.context;
    }
    return CommunicationContext.NOT_SURE;
}
