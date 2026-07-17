
export enum UserRole {
  GENERAL_USER = 'GENERAL_USER',
  ADMIN = 'ADMIN'
}

export enum AppView {
  UPLOAD = 'UPLOAD',
  RESULTS = 'RESULTS',
  HISTORY = 'HISTORY',
  BRAND_GUIDELINES = 'BRAND_GUIDELINES',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  ANALYTICS = 'ANALYTICS'
}

// Replaces 'Purpose' with strict Context enum
export enum CommunicationContext {
  SALES = 'Sales',
  MARKETING = 'Marketing',
  INTERNAL_OPS = 'Internal or Operations',
  HR = 'HR',
  LEGAL_COMPLIANCE = 'Legal or Compliance',
  NOT_SURE = 'Not sure'
}

// Deprecated: Kept effectively as an alias or submodule if needed, 
// but for this refactor we perform a full replacement where possible.
// We export Purpose as an alias to Context to minimize breakage if any, 
// OR we remove it. Given the strict requirement, I will remove it 
// and let the compiler guide the refactor.


export enum AudienceScope {
  INTERNAL = 'Internal',
  EXTERNAL = 'External'
}

export type Region = string;

export enum AssetType {
  // Internal Docs
  SOP = 'SOP',
  POLICY = 'Policy',
  MEMO = 'Memo/Email',
  TECH_SPEC = 'Tech Spec',
  HR_GUIDE = 'HR Guide',
  WHITE_PAPER = 'White Paper',

  // Internal Presentations
  TOWN_HALL = 'Town Hall Deck',
  QBR = 'QBR',
  TRAINING_SLIDES = 'Training Slides',
  PROJECT_REPORT = 'Project Report',

  // Internal AV
  MEETING_REC = 'Meeting Rec',
  ONBOARDING_VIDEO = 'Onboarding Video',
  LEADERSHIP_VLOG = 'Leadership Vlog',
  INTERNAL_PODCAST = 'Internal Podcast',
  PODCAST = 'Podcast',

  // Internal L&D
  ELEARNING = 'eLearning Module',
  SIMULATION = 'Simulation',
  QUIZ = 'Quiz',

  // Internal Visuals
  PROCESS_FLOW = 'Process Flow',
  ORG_CHART = 'Org Chart',
  POSTER = 'Poster',

  // External Sales
  PITCH_DECK = 'Pitch Deck',
  PROPOSAL = 'Proposal/RFP',
  CONTRACT = 'Contract/SOW',
  PRICE_LIST = 'Price List',

  // External Marketing
  WEB_CONTENT = 'Web Content',
  SOCIAL_ASSET = 'Social Asset',
  AD_CAMPAIGN = 'Ad Campaign',
  NEWSLETTER = 'Email/Newsletter',

  // External Content & Thought Leadership
  BLOG_POST = 'Blog Post',
  CASE_STUDY = 'Case Study',
  WHITE_PAPER_EXT = 'White Paper (External)',

  // External Video
  TV_SPOT = 'TV Spot',
  PRODUCT_DEMO = 'Product Demo',
  WEBINAR = 'Webinar',
  TESTIMONIAL = 'Testimonial',
  EXPLAINER_VIDEO = 'Explainer Video', // New

  // Internal Video (Specific)
  TRAINING_VIDEO = 'Training Video', // New
  CORP_COMMS_VIDEO = 'Corp Comm/Update', // New

  // External PR
  PRESS_RELEASE = 'Press Release',
  ANNUAL_REPORT = 'Annual Report',
  CRISIS_STATEMENT = 'Crisis Statement',

  // External Partner
  CO_BRANDED = 'Co-Branded Asset',
  RESELLER_KIT = 'Reseller Kit',

  // Support/Docs
  USER_GUIDE = 'User Guide/Manual',

  // HR & People
  JOB_DESC = 'Job Description',
  OFFER_LETTER = 'Offer Letter',
  PERF_REVIEW = 'Performance Review',
  RESUME = 'Resume/CV', // New
  INTERVIEW_NOTES = 'Interview Notes', // New

  // Legal
  NDA = 'NDA',
  MSA = 'MSA',
  PRIVACY_POLICY = 'Privacy Policy',
  TERMS = 'Terms of Service',

  // Sales / Enablement
  BATTLECARD = 'Battlecard',
  SALES_SCRIPT = 'Sales Script',
  EMAIL_TEMPLATE = 'Email Template',
  ONE_PAGER = 'One-Pager', // New

  // Marketing
  INFOGRAPHIC = 'Infographic',
  EBOOK = 'E-Book',
  landing_page = 'Landing Page',
  BRAND_GUIDELINES = 'Brand Guidelines', // New
  EVENT_RECAP = 'Event Recap', // New
  LOGO = 'Logo/Brand Asset', // New

  // Technical / R&D
  API_DOCS = 'API Documentation',
  RELEASE_NOTES = 'Release Notes',
  RESEARCH_PAPER = 'Research Paper', // New
  DIAGRAM = 'Diagram/Schematic', // New

  // Ops / Project
  MEETING_MINUTES = 'Meeting Minutes', // New
  PROJECT_BRIEF = 'Project Brief', // New
  STATUS_REPORT = 'Status Report', // New

  // Audio / Voice
  VOICE_MEMO = 'Voice Note/Memo', // New
  INTERVIEW_REC = 'Interview Recording', // New

  // Fallbacks/Legacy
  DOCUMENT = 'Document',
  PRESENTATION = 'Presentation',
  IMAGE = 'Image',
  VIDEO = 'Video',
  AUDIO = 'Audio Clip'
}

export interface BrandSettings {
  brandName: string;
  mission: string;
  audience: string;
  toneVoice: string;
  styleGuide: string;
  bannedTerms: string;
  inclusiveLanguage: boolean;
}

export enum Modality {
  TEXT_DOMINANT = 'Text Dominant',
  VISUAL_DOMINANT = 'Visual Dominant',
  MIXED = 'Mixed', // Slides, Docs with layout
  VIDEO = 'Video'
}

export interface IngestedAsset {
  id: string;
  metadata: {
    uploadTime: number;
    owner: string; // "General User" for now
    originalFormat: string;
  };
  modality: Modality;
  content: string | ArrayBuffer; // Raw text or Base64
  rawFile: File;
  htmlPreview?: string; // Specific for DOCX
  visualSlides?: { data: string; mimeType: string }[]; // Extracted slide/page images with MIME type
  flags: {
    isScreenshot: boolean;
  };
}

export interface Issue {
  id: string;
  category: 'Brand' | 'Compliance' | 'Cultural';
  subcategory: string;
  description: string; // The "What"
  rationale: string; // The "Why"
  fix: string; // The "How"
  severity: 'Low' | 'Medium' | 'High';
  blocking: boolean; // New: determines safety status
  fixType: 'Deterministic' | 'Manual'; // New
  boundingBox?: { x: number; y: number; width: number; height: number; };
  timestamp?: number;
  page_number?: number; // Added for multi-page document annotations
}

export interface CulturalInsight {
  dimension: 'Symbolism' | 'Language' | 'Taboo' | 'Values' | 'Humor';
  observation: string;
  riskLevel: 'Safe' | 'Risky' | 'Offensive';
  recommendation: string;
}

export interface Claim {
  text: string;
  status: 'Verified' | 'Unverified' | 'Expired';
  citation?: string;
}

export type SafetyStatus = 'Safe' | 'Caution' | 'Unsafe';

export interface AnalysisResult {
  safetyStatus: SafetyStatus;
  summary: string;
  brandScore: number; // 0-100
  issues: Issue[];
  correctedText?: string;
}

export interface UploadState {
  ingestedAsset?: IngestedAsset;
  file: File | null;
  textInput: string;
  sharePointUrl?: string;
  context: CommunicationContext;
  region: Region;
  assetType: AssetType;
  fileBase64?: string;
  mimeType?: string;
  additionalContext: string;
  detectedConfidence: number;
  htmlPreview?: string;
  audienceScope: AudienceScope; // New (Section B)
}

export interface HistoryItem {
  id: string;
  box_2d?: number[];
  page_number?: number;
  filename: string;
  type: AssetType;
  date: string;
  safetyStatus: SafetyStatus; // Replaces score/status
  context: CommunicationContext;
  region: Region;
  issuesCount: number; // Renamed from issues for clarity
  topIssues?: string[];
  contextSnapshot?: any;
}

export type FixIntensity = 'Low' | 'Medium' | 'High';
