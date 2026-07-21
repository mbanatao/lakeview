import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize,
  FileText,
  ChevronDown,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  X,
  Check,
  AlertCircle,
  FileCheck,
  Download,
  MapPin,
  Loader2,
} from 'lucide-react';

// ==========================================
// 1. PROPERTY DATA CONFIGURATION
// ==========================================
const PROPERTY_DATA = {
  address: '301 Ilang-Ilang Street',
  subdivision: 'Lakeview Homes Subdivision',
  city: 'Putatan, Muntinlupa City, Metro Manila',
  totalLotArea: 195,
  lots: [
    { name: 'Lot 5-A', area: 95, tct: 'TCT No. 014-2017000***' },
    { name: 'Lot 5-B', area: 100, tct: 'TCT No. 014-2017000***' },
  ],
  structure: 'Existing single-storey structure',
  status: 'Two adjoining titled lots — documents available for due diligence.',
};

const UNVERIFIED_LABEL = 'Subject to verification';

// All 11 property photos, organised by category.
const IMAGES = [
  { src: '/property/exterior/facade.jpg', alt: 'Property front facade with tiled feature wall', category: 'Exterior' },
  { src: '/property/exterior/gate.jpg', alt: 'Front gate and entrance walkway', category: 'Exterior' },
  { src: '/property/exterior/street.jpg', alt: 'Street view of the property frontage', category: 'Exterior' },
  { src: '/property/living/coffered-ceiling.jpg', alt: 'Living area with coffered wood ceiling and ceiling fan', category: 'Living Areas' },
  { src: '/property/living/living-room.jpg', alt: 'Main living room with seating and natural light', category: 'Living Areas' },
  { src: '/property/living/staircase.jpg', alt: 'Living area with console and staircase', category: 'Living Areas' },
  { src: '/property/bedrooms/brick-accent.jpg', alt: 'Bedroom with brick accent wall and air-conditioning', category: 'Bedrooms' },
  { src: '/property/bedrooms/wardrobe.jpg', alt: 'Bedroom with built-in wardrobe', category: 'Bedrooms' },
  { src: '/property/kitchen-dining/kitchen.jpg', alt: 'Kitchen with range hood and gas stove', category: 'Kitchen & Dining' },
  { src: '/property/kitchen-dining/dining.jpg', alt: 'Dining area with granite table and windows', category: 'Kitchen & Dining' },
  { src: '/property/office/home-office.jpg', alt: 'Interior space configured as a home office', category: 'Home Office' },
];

const HERO_IMAGE = '/property/exterior/facade.jpg';

const GALLERY_CATEGORIES = ['All', 'Exterior', 'Living Areas', 'Bedrooms', 'Kitchen & Dining', 'Home Office'];

const TIMELINE = [
  { step: 1, title: 'Initial Inquiry', desc: 'Request the property brief and ask preliminary questions.' },
  { step: 2, title: 'Property Viewing', desc: 'Schedule an on-site visit to inspect the physical condition of the property.' },
  { step: 3, title: 'Due Diligence', desc: 'Request the Due-Diligence Pack to independently verify titles, taxes, and annotations.' },
  { step: 4, title: 'Offer & Negotiation', desc: 'Submit a formal offer based on your technical and legal findings.' },
  { step: 5, title: 'Contract & Turnover', desc: 'Execution of the Deed of Absolute Sale and transfer of possession.' },
];

const FAQS = [
  { q: 'Is the property comprised of a single title?', a: 'No. The property consists of two adjoining titled lots (Lot 5-A at 95 sqm and Lot 5-B at 100 sqm) totaling 195 sqm. They are being sold together.' },
  { q: 'What is the status of the Rule 74 annotation?', a: 'A Section 4, Rule 74 annotation (dated 2017) appears on both titles. Requirements for its cancellation and the property’s transferability are currently being verified with the Registry of Deeds.' },
  { q: 'Is the property flood-free?', a: 'Subject to verification. Buyers are encouraged to review local hazard maps and conduct their own neighborhood assessments during viewing.' },
  { q: 'Can this be used for commercial purposes?', a: 'Subject to verification. While Barangay Putatan has mixed-use zones, buyers must verify specific business-use permissions and zoning ordinances with the Muntinlupa City Hall.' },
  { q: 'Is the property eligible for bank or Pag-IBIG financing?', a: 'Subject to verification. Financing eligibility depends on the lending institution’s appraisal of the property condition and title status (including the existing annotation).' },
];

// ==========================================
// 2. UI PRIMITIVES (shadcn/ui-style)
// ==========================================
const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-900/90 shadow-sm',
    outline: 'border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-900',
    ghost: 'hover:bg-neutral-100 hover:text-neutral-900 text-neutral-600',
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} px-4 py-2 ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';

const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

// ==========================================
// 3. PAGE SECTIONS
// ==========================================
const Header = ({ scrolled }) => (
  <header
    className={`fixed top-0 w-full z-40 transition-all duration-300 border-b ${
      scrolled
        ? 'bg-white/95 backdrop-blur-sm border-neutral-200 py-4 shadow-sm'
        : 'bg-transparent border-transparent py-6'
    }`}
  >
    <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
      <div className={`font-semibold tracking-wide text-sm ${scrolled ? 'text-neutral-900' : 'text-neutral-900 md:text-white'}`}>
        LAKEVIEW HOMES, PUTATAN
      </div>
      <div className="hidden md:flex gap-8 text-sm font-medium">
        {['overview', 'gallery', 'documents'].map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className={`${scrolled ? 'text-neutral-600' : 'text-white/90'} hover:text-neutral-900 transition-colors capitalize`}
          >
            {id === 'documents' ? 'Due Diligence' : id}
          </a>
        ))}
      </div>
      <a
        href="#inquire"
        className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
          scrolled ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-white text-neutral-900 hover:bg-neutral-100'
        }`}
      >
        Request Brief
      </a>
    </div>
  </header>
);

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const HeroSection = () => (
  <section className="relative h-[85vh] w-full bg-neutral-900 flex flex-col justify-end pb-24 md:pb-32 overflow-hidden">
    <div className="absolute inset-0 z-0">
      <img src={HERO_IMAGE} alt="Property facade" className="w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-neutral-900/20" />
    </div>
    <div className="relative z-10 px-6 max-w-6xl mx-auto w-full">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <p className="text-white/70 uppercase tracking-widest text-xs font-semibold mb-4 border-l-2 border-white/70 pl-3">
          For Sale &bull; Property Preview
        </p>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium text-white leading-tight tracking-tight mb-6 max-w-3xl">
          195 sqm House-and-Lot Property in Lakeview Homes, Putatan
        </h1>
        <p className="text-neutral-300 text-base md:text-lg max-w-2xl leading-relaxed mb-8">
          Two adjoining titled lots with an existing single-storey structure, suitable for family living, home-office
          use, or future redevelopment.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => scrollTo('inquire')} className="h-12 px-8 text-base bg-white text-neutral-900 hover:bg-neutral-100">
            Schedule a Viewing
          </Button>
          <Button
            variant="outline"
            onClick={() => scrollTo('documents')}
            className="h-12 px-8 text-base bg-transparent border-white/30 text-white hover:bg-white/10"
          >
            View Disclosures
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

const PropertyFacts = () => (
  <section className="bg-white border-b border-neutral-200">
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Asking Price</p>
          <p className="text-base font-medium text-neutral-900">{UNVERIFIED_LABEL}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Total Lot Area</p>
          <p className="text-base font-medium text-neutral-900">{PROPERTY_DATA.totalLotArea} sqm</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Floor Area</p>
          <p className="text-sm font-medium text-neutral-500">{UNVERIFIED_LABEL}</p>
        </div>
        <div>
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Bed / Bath</p>
          <p className="text-sm font-medium text-neutral-500">{UNVERIFIED_LABEL}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">TCT Status</p>
          <p className="text-sm font-medium text-neutral-900">{PROPERTY_DATA.status}</p>
        </div>
      </div>
    </div>
  </section>
);

const Disclosures = () => (
  <section id="disclosures" className="py-12 bg-white">
    <div className="max-w-4xl mx-auto px-6">
      <div className="bg-neutral-50 border-l-4 border-neutral-900 p-6 md:p-8 rounded-r-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-neutral-900 shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">What Buyers Should Know</h3>
            <ul className="space-y-3 text-neutral-700 text-sm md:text-base leading-relaxed list-disc pl-5 marker:text-neutral-400">
              <li>The property is composed of two adjoining titles sold together.</li>
              <li>The combined titled area is exactly 195 sqm (Lot 5-A: 95 sqm, Lot 5-B: 100 sqm).</li>
              <li>
                <strong>A Section 4, Rule 74 annotation is visible on the titles.</strong> Cancellation and transfer
                requirements are being verified with the Registry of Deeds.
              </li>
              <li>Exact floor area, room count, tax status, property condition, and financing eligibility remain subject to verification.</li>
              <li>Buyers are strictly encouraged to conduct independent legal, technical, and physical due diligence prior to making an offer.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const LotBreakdown = () => (
  <section id="overview" className="py-16 bg-white border-t border-neutral-100">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-2xl font-semibold mb-8">Property Composition</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {PROPERTY_DATA.lots.map((lot) => (
          <div key={lot.name} className="border border-neutral-200 rounded-lg p-6 bg-white">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-lg">{lot.name}</h4>
              <span className="bg-neutral-100 text-neutral-600 text-xs px-2 py-1 rounded font-medium">{lot.area} sqm</span>
            </div>
            <p className="text-sm text-neutral-500 font-mono mb-4">{lot.tct}</p>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Check size={16} className="text-neutral-400" /> Contains part of existing structure
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
        <MapPin size={16} className="text-neutral-400" />
        {PROPERTY_DATA.address}, {PROPERTY_DATA.subdivision}, {PROPERTY_DATA.city}
      </p>
    </div>
  </section>
);

const GallerySection = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const filteredImages =
    activeCategory === 'All' ? IMAGES : IMAGES.filter((img) => img.category === activeCategory);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : 'unset';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxIndex, filteredImages.length]);

  return (
    <section id="gallery" className="py-16 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-6">Property Gallery</h2>

        <div className="flex flex-wrap gap-2 mb-8">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === cat
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
          {filteredImages.map((img, i) => (
            <div
              key={img.src}
              onClick={() => setLightboxIndex(i)}
              className={`relative cursor-pointer overflow-hidden rounded-lg bg-neutral-200 group ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={i > 2 ? 'lazy' : 'eager'}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
              <span className="absolute top-2 left-2 bg-black/50 text-white text-[10px] uppercase tracking-wide px-2 py-0.5 rounded">
                {img.category}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-4 italic">
          *Images depict the current state of the property. Actual sizing and boundaries subject to technical survey.
        </p>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center text-white z-10">
              <span className="text-sm font-medium">
                {lightboxIndex + 1} / {filteredImages.length}
                <span className="text-white/50 ml-3">{filteredImages[lightboxIndex].category}</span>
              </span>
              <button onClick={() => setLightboxIndex(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <button
              onClick={() => setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length)}
              className="absolute left-4 md:left-8 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              aria-label="Previous image"
            >
              <ArrowLeft size={32} />
            </button>

            <img
              src={filteredImages[lightboxIndex].src}
              alt={filteredImages[lightboxIndex].alt}
              className="max-w-full max-h-[85vh] object-contain"
            />

            <button
              onClick={() => setLightboxIndex((prev) => (prev + 1) % filteredImages.length)}
              className="absolute right-4 md:right-8 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
              aria-label="Next image"
            >
              <ArrowRightIcon size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const DocumentSection = () => (
  <section id="documents" className="py-20 bg-neutral-900 text-white">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-3xl font-semibold mb-6">Due Diligence Documents</h2>
      <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
        To maintain security and privacy, full sensitive documents are not publicly downloadable. A comprehensive
        Due-Diligence Pack is available upon verified request.
      </p>

      <div className="space-y-4 mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-neutral-700 rounded-lg bg-neutral-800/50">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-neutral-800 rounded-md">
              <FileCheck className="text-neutral-300" size={24} />
            </div>
            <div>
              <p className="font-medium">Title Set (Redacted Preview)</p>
              <p className="text-sm text-neutral-400">TCT 014-2017000*** &amp; TCT 014-2017000***</p>
            </div>
          </div>
          <span className="bg-neutral-800 text-neutral-300 text-xs px-3 py-1 rounded-full border border-neutral-600">Available</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border border-neutral-700 rounded-lg bg-neutral-800/50 opacity-70">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-neutral-800 rounded-md">
              <FileText className="text-neutral-500" size={24} />
            </div>
            <div>
              <p className="font-medium text-neutral-300">Tax Declarations</p>
              <p className="text-sm text-neutral-500">Status pending verification</p>
            </div>
          </div>
          <span className="bg-transparent text-neutral-500 text-xs px-3 py-1 rounded-full border border-neutral-700">For Verification</span>
        </div>
      </div>

      <Button
        onClick={() => scrollTo('inquire')}
        className="w-full sm:w-auto bg-white text-neutral-900 hover:bg-neutral-200 h-12 px-8 flex gap-2"
      >
        <Download size={18} /> Request Due-Diligence Pack
      </Button>
    </div>
  </section>
);

const Timeline = () => (
  <section className="py-20 bg-white border-b border-neutral-200">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-2xl font-semibold mb-12">Buying Process</h2>
      <div className="relative border-l-2 border-neutral-200 ml-3 md:ml-4">
        {TIMELINE.map((item) => (
          <div key={item.step} className="relative pl-10 md:pl-12 pb-10 last:pb-0">
            <div className="absolute -left-[15px] md:-left-[17px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-semibold">
              {item.step}
            </div>
            <h4 className="font-medium text-lg text-neutral-900 mb-1">{item.title}</h4>
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="faq" className="py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-semibold mb-8">Frequently Asked Questions</h2>
        <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex justify-between items-center text-left py-5 gap-4"
                >
                  <span className="font-medium text-neutral-900 text-base md:text-lg">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="text-neutral-600 text-sm md:text-base leading-relaxed pb-5 pr-8">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 4. INQUIRY FORM (react-hook-form + zod)
// ==========================================
const inquirySchema = z.object({
  name: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().min(7, 'Please enter a valid contact number.'),
  interest: z.enum(['viewing', 'due-diligence', 'general'], {
    errorMap: () => ({ message: 'Please select an option.' }),
  }),
  message: z.string().max(1000, 'Message is too long.').optional(),
});

const FieldError = ({ error }) =>
  error ? (
    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle size={12} /> {error.message}
    </p>
  ) : null;

const InquiryForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(inquirySchema),
    defaultValues: { name: '', email: '', phone: '', interest: 'viewing', message: '' },
  });

  const onSubmit = async (data) => {
    // No backend is wired up in this preview. Simulate an async submission
    // so the UX is complete; replace with a real endpoint when available.
    await new Promise((r) => setTimeout(r, 800));
    // eslint-disable-next-line no-console
    console.log('Inquiry submitted:', data);
    setSubmitted(true);
    reset();
  };

  return (
    <section id="inquire" className="py-20 bg-white">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold mb-3">Request the Property Brief</h2>
          <p className="text-neutral-600 leading-relaxed">
            Submit your details to schedule a viewing or request the Due-Diligence Pack. Inquiries are handled directly
            by the owner&rsquo;s representative.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-neutral-200 rounded-lg p-10 text-center bg-neutral-50"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mb-4">
                <Check size={24} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Inquiry received</h3>
              <p className="text-neutral-600 mb-6">
                Thank you. Your inquiry has been recorded and the owner&rsquo;s representative will follow up shortly.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit another inquiry
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
                  <Input placeholder="Juan dela Cruz" {...register('name')} />
                  <FieldError error={errors.name} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Contact Number</label>
                  <Input placeholder="+63 9XX XXX XXXX" {...register('phone')} />
                  <FieldError error={errors.phone} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address</label>
                <Input type="email" placeholder="you@example.com" {...register('email')} />
                <FieldError error={errors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">I am interested in</label>
                <select
                  {...register('interest')}
                  className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                >
                  <option value="viewing">Scheduling a property viewing</option>
                  <option value="due-diligence">Requesting the Due-Diligence Pack</option>
                  <option value="general">General questions</option>
                </select>
                <FieldError error={errors.interest} />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Message (optional)</label>
                <Textarea rows={4} placeholder="Any preliminary questions or preferred viewing dates..." {...register('message')} />
                <FieldError error={errors.message} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base">
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" /> Sending...
                  </>
                ) : (
                  'Submit Inquiry'
                )}
              </Button>

              <p className="text-xs text-neutral-500 text-center leading-relaxed">
                By submitting, you acknowledge that all property details are subject to independent verification. This
                form does not constitute a reservation or offer.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-neutral-950 text-neutral-400 py-12">
    <div className="max-w-6xl mx-auto px-6">
      <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
        <div className="max-w-sm">
          <div className="font-semibold tracking-wide text-white text-sm mb-3">LAKEVIEW HOMES, PUTATAN</div>
          <p className="text-sm leading-relaxed">
            {PROPERTY_DATA.address}, {PROPERTY_DATA.subdivision}, {PROPERTY_DATA.city}.
          </p>
        </div>
        <div className="flex gap-12 text-sm">
          <div>
            <p className="text-white font-medium mb-3">Explore</p>
            <ul className="space-y-2">
              <li><a href="#overview" className="hover:text-white transition-colors">Overview</a></li>
              <li><a href="#gallery" className="hover:text-white transition-colors">Gallery</a></li>
              <li><a href="#documents" className="hover:text-white transition-colors">Due Diligence</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium mb-3">Inquire</p>
            <ul className="space-y-2">
              <li><a href="#inquire" className="hover:text-white transition-colors">Request Brief</a></li>
              <li><a href="#inquire" className="hover:text-white transition-colors">Schedule Viewing</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-800 pt-6 text-xs leading-relaxed">
        <p className="mb-2">
          <strong className="text-neutral-300">Disclaimer:</strong> This page is a property preview for informational
          purposes only. All areas, boundaries, structural details, tax status, annotations, and financing eligibility
          are subject to independent verification. Nothing herein constitutes an offer, warranty, or professional legal
          advice.
        </p>
        <p>&copy; {new Date().getFullYear()} Lakeview Homes property listing. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// ==========================================
// 5. APP ASSEMBLY
// ==========================================
export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <Header scrolled={scrolled} />
      <main>
        <HeroSection />
        <PropertyFacts />
        <Disclosures />
        <LotBreakdown />
        <GallerySection />
        <DocumentSection />
        <Timeline />
        <FaqSection />
        <InquiryForm />
      </main>
      <Footer />
    </div>
  );
}
