import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FileCheck,
  FileText,
  HeartHandshake,
  Hospital,
  Loader2,
  Mail,
  MapPin,
  Maximize,
  MessageCircle,
  Phone,
  School,
  ShoppingBasket,
  X,
} from 'lucide-react';

const PROPERTY = {
  address: '301 Ilang-Ilang Street',
  subdivision: 'Lakeview Homes Subdivision',
  city: 'Putatan, Muntinlupa City, Metro Manila',
  totalLotArea: 195,
  structure: 'Existing finished residential structure',
  lots: [
    { name: 'Lot 5-A', area: 95, tct: 'TCT No. 014-2017••••430' },
    { name: 'Lot 5-B', area: 100, tct: 'TCT No. 014-2017••••431' },
  ],
};

const CONTACT = {
  phoneDisplay: '0968-184-1001',
  phoneHref: 'tel:+639681841001',
  whatsappHref:
    'https://wa.me/639681841001?text=Hello%2C%20I%20am%20interested%20in%20the%20Lakeview%20Homes%20property.',
  email: 'markjohnsonbanatao888@gmail.com',
};

const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE ?? '';
const imgUrl = (path) => `${IMAGE_BASE}${path}`;

const IMAGES = [
  { src: '/property/exterior/facade.jpg', alt: 'Street-facing facade of the Lakeview Homes property', category: 'Exterior' },
  { src: '/property/exterior/gate.jpg', alt: 'Front gate and landscaped entrance', category: 'Exterior' },
  { src: '/property/exterior/street.jpg', alt: 'Property frontage along Ilang-Ilang Street', category: 'Exterior' },
  { src: '/property/living/coffered-ceiling.jpg', alt: 'Living area with decorative ceiling details', category: 'Living Areas' },
  { src: '/property/living/living-room.jpg', alt: 'Main living room with seating and natural light', category: 'Living Areas' },
  { src: '/property/living/staircase.jpg', alt: 'Living area with interior staircase', category: 'Living Areas' },
  { src: '/property/bedrooms/brick-accent.jpg', alt: 'Bedroom with accent wall and air-conditioning unit', category: 'Bedrooms' },
  { src: '/property/bedrooms/wardrobe.jpg', alt: 'Bedroom with built-in wardrobe', category: 'Bedrooms' },
  { src: '/property/kitchen-dining/kitchen.jpg', alt: 'Fitted kitchen with cabinetry and range hood', category: 'Kitchen & Dining' },
  { src: '/property/kitchen-dining/dining.jpg', alt: 'Dining area with windows', category: 'Kitchen & Dining' },
  { src: '/property/office/home-office.jpg', alt: 'Interior room configured as a home office', category: 'Home Office' },
];

const CATEGORIES = ['All', 'Exterior', 'Living Areas', 'Bedrooms', 'Kitchen & Dining', 'Home Office'];

const NEARBY = [
  { icon: Building2, title: 'City services', text: 'Convenient access to Muntinlupa City Hall and government offices.' },
  { icon: School, title: 'Schools nearby', text: 'Educational institutions are available throughout the Putatan area.' },
  { icon: Hospital, title: 'Healthcare access', text: 'Hospitals, clinics, and community health services are close by.' },
  { icon: ShoppingBasket, title: 'Daily essentials', text: 'Groceries, convenience stores, pharmacies, and neighborhood shops nearby.' },
];

const FAQS = [
  {
    q: 'Is this one titled property?',
    a: 'The sale covers two adjoining titled lots: Lot 5-A at 95 sqm and Lot 5-B at 100 sqm, for a combined titled area of 195 sqm. They are being offered together.',
  },
  {
    q: 'What is the Rule 74 annotation?',
    a: 'A Section 4, Rule 74 annotation appears on both titles. The applicable cancellation, documentary, and transfer requirements should be confirmed with the Registry of Deeds during due diligence.',
  },
  {
    q: 'Is the property flood-free?',
    a: 'Flood status has not been independently verified. Buyers should review official hazard maps and inspect the neighborhood personally.',
  },
  {
    q: 'Can the property be used for business?',
    a: 'Business use is not represented as approved. Buyers should verify zoning, subdivision restrictions, permits, and allowable use with the relevant authorities.',
  },
  {
    q: 'Can this be financed?',
    a: 'Financing depends on the lender’s appraisal, buyer qualification, property condition, and title review. Buyers should confirm directly with their chosen bank or financing institution.',
  },
];

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-neutral-950 text-white hover:bg-neutral-800',
    outline: 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100',
    light: 'bg-white text-neutral-950 hover:bg-neutral-100',
  };
  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const Header = ({ scrolled }) => (
  <header className={`fixed inset-x-0 top-0 z-40 transition-all ${scrolled ? 'border-b border-neutral-200 bg-white/95 py-3 shadow-sm backdrop-blur' : 'bg-transparent py-5'}`}>
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
      <a href="#top" className={`text-xs font-bold tracking-[0.16em] ${scrolled ? 'text-neutral-950' : 'text-white'}`}>
        LAKEVIEW HOMES · PUTATAN
      </a>
      <nav className="hidden items-center gap-7 md:flex">
        {['gallery', 'location', 'details', 'documents'].map((id) => (
          <a key={id} href={`#${id}`} className={`text-sm font-medium capitalize ${scrolled ? 'text-neutral-600 hover:text-neutral-950' : 'text-white/85 hover:text-white'}`}>
            {id}
          </a>
        ))}
      </nav>
      <Button variant={scrolled ? 'primary' : 'light'} className="px-5 py-2" onClick={() => scrollTo('inquire')}>
        Book a Viewing
      </Button>
    </div>
  </header>
);

const Hero = () => (
  <section id="top" className="relative flex min-h-[88vh] items-end overflow-hidden bg-neutral-950 pb-16 md:pb-24">
    <img src={imgUrl(IMAGES[0].src)} alt={IMAGES[0].alt} className="absolute inset-0 h-full w-full object-cover opacity-65" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
    <div className="relative mx-auto w-full max-w-7xl px-5 md:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white/75">For sale · Lakeview Homes</p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
          195 sqm house-and-lot property in central Putatan.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
          Two adjoining titled lots with a finished residence, close to city services, schools, healthcare, groceries, and everyday essentials.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="light" className="px-7 py-3.5 text-base" onClick={() => scrollTo('gallery')}>View Photos</Button>
          <Button className="border border-white/30 bg-white/10 px-7 py-3.5 text-base text-white backdrop-blur hover:bg-white/20" onClick={() => scrollTo('inquire')}>Schedule Viewing</Button>
        </div>
      </motion.div>
    </div>
  </section>
);

const Highlights = () => (
  <section className="border-b border-neutral-200 bg-white">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-neutral-200 md:grid-cols-4">
      {[
        ['195 sqm', 'Combined titled area'],
        ['2 titles', 'Sold together'],
        ['Finished home', 'Existing residence'],
        ['Putatan', 'Near essential destinations'],
      ].map(([value, label]) => (
        <div key={value} className="bg-white px-5 py-8 md:px-8 md:py-10">
          <p className="text-2xl font-semibold tracking-tight md:text-3xl">{value}</p>
          <p className="mt-1 text-sm text-neutral-500">{label}</p>
        </div>
      ))}
    </div>
  </section>
);

const Gallery = () => {
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState(null);
  const filtered = useMemo(() => (category === 'All' ? IMAGES : IMAGES.filter((image) => image.category === category)), [category]);

  useEffect(() => {
    const onKey = (event) => {
      if (active === null) return;
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive((active + 1) % filtered.length);
      if (event.key === 'ArrowLeft') setActive((active - 1 + filtered.length) % filtered.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = active === null ? '' : 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, filtered.length]);

  return (
    <section id="gallery" className="bg-neutral-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Inside the property</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">See the home, not just the listing.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button key={item} onClick={() => { setCategory(item); setActive(null); }} className={`rounded-full border px-4 py-2 text-sm font-medium ${category === item ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-500'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid auto-rows-[190px] grid-cols-2 gap-3 md:auto-rows-[250px] md:grid-cols-4">
          {filtered.map((image, index) => (
            <button key={image.src} onClick={() => setActive(index)} className={`group relative overflow-hidden rounded-2xl bg-neutral-200 text-left ${index === 0 ? 'col-span-2 row-span-2' : ''} ${index === 3 ? 'md:col-span-2' : ''}`}>
              <img src={imgUrl(image.src)} alt={image.alt} loading={index > 2 ? 'lazy' : 'eager'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-80" />
              <span className="absolute bottom-4 left-4 text-xs font-semibold uppercase tracking-wider text-white">{image.category}</span>
              <Maximize className="absolute right-4 top-4 text-white opacity-0 transition group-hover:opacity-100" size={20} />
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          Photos show the property at the time they were taken. Furniture, appliances, equipment, and movable items are not included unless stated in the final agreement.
        </p>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div role="dialog" aria-modal="true" aria-label="Property photo gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
            <button aria-label="Close gallery" onClick={() => setActive(null)} className="absolute right-5 top-5 rounded-full p-3 text-white hover:bg-white/10"><X /></button>
            <button aria-label="Previous image" onClick={() => setActive((active - 1 + filtered.length) % filtered.length)} className="absolute left-3 rounded-full p-3 text-white hover:bg-white/10 md:left-8"><ArrowLeft size={30} /></button>
            <img src={imgUrl(filtered[active].src)} alt={filtered[active].alt} className="max-h-[85vh] max-w-[88vw] object-contain" />
            <button aria-label="Next image" onClick={() => setActive((active + 1) % filtered.length)} className="absolute right-3 rounded-full p-3 text-white hover:bg-white/10 md:right-8"><ArrowRight size={30} /></button>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-sm text-white/80">{active + 1} / {filtered.length} · {filtered[active].category}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Location = () => {
  const mapQuery = encodeURIComponent(`${PROPERTY.address}, ${PROPERTY.subdivision}, ${PROPERTY.city}`);
  return (
    <section id="location" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Location advantage</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Everything you need, close to home.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">City services, education, healthcare, shopping, and transport are all within the surrounding Putatan area.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl bg-neutral-100">
            <iframe title="Approximate property location in Lakeview Homes, Putatan" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold">Lakeview Homes, Putatan</p>
              <p className="mt-1 text-xs text-neutral-500">Map pin and travel times should be confirmed before final publication.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {NEARBY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-neutral-100 p-3"><Icon size={21} /></div>
                  <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-neutral-600">{text}</p></div>
                </div>
              </div>
            ))}
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-5 py-4 text-sm font-semibold text-white hover:bg-neutral-800">
              <MapPin size={18} /> Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const Details = () => (
  <section id="details" className="bg-neutral-950 py-20 text-white md:py-28">
    <div className="mx-auto max-w-7xl px-5 md:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Property composition</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Two adjoining lots. One complete property.</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/65">The titles indicate a combined land area of 195 sqm. Exact physical boundaries and improvements should be confirmed through survey and inspection.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PROPERTY.lots.map((lot) => (
            <div key={lot.name} className="rounded-3xl border border-white/10 bg-white/5 p-7">
              <p className="text-sm text-white/50">{lot.name}</p>
              <p className="mt-2 text-4xl font-semibold">{lot.area} sqm</p>
              <p className="mt-5 font-mono text-xs text-white/45">{lot.tct}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/70"><Check size={16} /> Included in the combined sale</p>
            </div>
          ))}
          <div className="rounded-3xl bg-white p-7 text-neutral-950 sm:col-span-2">
            <p className="text-sm text-neutral-500">Combined titled area</p>
            <p className="mt-2 text-5xl font-semibold">195 sqm</p>
            <p className="mt-3 text-sm text-neutral-600">{PROPERTY.structure}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Documents = () => {
  const [open, setOpen] = useState(false);
  return (
    <section id="documents" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">Due diligence</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Clear information. Serious-buyer access.</h2>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">Sensitive documents are not publicly downloadable. Redacted previews and the full document pack may be requested for qualified due diligence.</p>

        <div className="mt-9 space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center gap-4"><FileCheck /><div><p className="font-semibold">Two-title set</p><p className="text-sm text-neutral-500">Redacted preview available</p></div></div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium">Available</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-center gap-4"><FileText /><div><p className="font-semibold">Tax and supporting records</p><p className="text-sm text-neutral-500">Status to be confirmed</p></div></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">For verification</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left">
              <div><p className="font-semibold">View title disclosure</p><p className="text-sm text-neutral-500">Rule 74 annotation and buyer due-diligence notes</p></div>
              <ChevronDown className={`transition ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-neutral-200 bg-neutral-50 p-5 text-sm leading-relaxed text-neutral-600">
                    <p>A Section 4, Rule 74 annotation appears on both titles. The applicable procedure, requirements, cost, and timing for cancellation or transfer should be confirmed with the Registry of Deeds.</p>
                    <p className="mt-3">Floor area, room count, tax status, property condition, financing eligibility, zoning, and physical boundaries remain subject to independent verification.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <Button className="mt-7" onClick={() => scrollTo('inquire')}>Request the property brief</Button>
      </div>
    </section>
  );
};

const inquirySchema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  phone: z.string().min(7, 'Please enter a valid contact number.'),
  email: z.string().email('Please enter a valid email address.'),
  interest: z.enum(['viewing', 'documents', 'question']),
  message: z.string().max(1000).optional(),
});

const Inquiry = () => {
  const [opening, setOpening] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(inquirySchema), defaultValues: { interest: 'viewing' } });

  const onSubmit = (data) => {
    setOpening(true);
    const subject = encodeURIComponent(`Lakeview property inquiry — ${data.interest}`);
    const body = encodeURIComponent(`Name: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email}\nInterest: ${data.interest}\n\n${data.message || ''}`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setTimeout(() => setOpening(false), 1000);
  };

  const ErrorText = ({ error }) => error ? <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle size={12} />{error.message}</p> : null;

  return (
    <section id="inquire" className="relative overflow-hidden bg-neutral-900 py-20 text-white md:py-28">
      <img src={imgUrl('/property/living/living-room.jpg')} alt="Living room background" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-neutral-950/75" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Private viewing</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">See it in person.</h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">The best way to understand the layout, location, and potential of the full 195 sqm property is to visit it.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a href={CONTACT.phoneHref} className="inline-flex items-center gap-3 text-white"><Phone size={19} /> {CONTACT.phoneDisplay}</a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-white"><MessageCircle size={19} /> Message on WhatsApp</a>
            <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-3 break-all text-white"><Mail size={19} /> {CONTACT.email}</a>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl bg-white p-6 text-neutral-950 shadow-2xl md:p-8" noValidate>
          <h3 className="text-2xl font-semibold">Request a viewing or property brief</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Full name<input {...register('name')} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:ring-2 focus:ring-neutral-950" /><ErrorText error={errors.name} /></label>
            <label className="text-sm font-medium">Contact number<input {...register('phone')} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:ring-2 focus:ring-neutral-950" /><ErrorText error={errors.phone} /></label>
            <label className="text-sm font-medium sm:col-span-2">Email<input type="email" {...register('email')} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:ring-2 focus:ring-neutral-950" /><ErrorText error={errors.email} /></label>
            <label className="text-sm font-medium sm:col-span-2">I am interested in<select {...register('interest')} className="mt-1.5 h-11 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:ring-2 focus:ring-neutral-950"><option value="viewing">Scheduling a viewing</option><option value="documents">Requesting the property brief</option><option value="question">Asking a question</option></select></label>
            <label className="text-sm font-medium sm:col-span-2">Message<textarea rows="4" {...register('message')} className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-neutral-950" placeholder="Preferred viewing schedule or questions..." /></label>
          </div>
          <Button type="submit" className="mt-5 w-full py-3.5 text-base" disabled={opening}>{opening ? <><Loader2 className="mr-2 animate-spin" size={18} />Opening email…</> : 'Send Inquiry'}</Button>
          <p className="mt-3 text-center text-xs leading-relaxed text-neutral-500">This opens your email app with the inquiry details filled in. Property information remains subject to independent verification.</p>
        </form>
      </div>
    </section>
  );
};

const FAQ = () => {
  const [open, setOpen] = useState(null);
  return (
    <section className="bg-neutral-50 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Common buyer questions</h2>
        <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {FAQS.map((faq, index) => (
            <div key={faq.q}>
              <button onClick={() => setOpen(open === index ? null : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold"><span>{faq.q}</span><ChevronDown className={`shrink-0 transition ${open === index ? 'rotate-180' : ''}`} /></button>
              <AnimatePresence initial={false}>{open === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="pb-5 pr-8 text-sm leading-relaxed text-neutral-600">{faq.a}</p></motion.div>}</AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MobileBar = () => (
  <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-neutral-200 bg-white p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] md:hidden">
    <a href={CONTACT.phoneHref} className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold"><Phone size={19} />Call</a>
    <a href={CONTACT.whatsappHref} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold"><MessageCircle size={19} />Message</a>
    <button onClick={() => scrollTo('inquire')} className="flex flex-col items-center gap-1 rounded-xl bg-neutral-950 py-2 text-xs font-semibold text-white"><HeartHandshake size={19} />View</button>
  </div>
);

const Footer = () => (
  <footer className="bg-black px-5 py-12 text-neutral-400 md:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-7 md:flex-row">
        <div><p className="font-semibold text-white">Lakeview Homes, Putatan</p><p className="mt-2 max-w-md text-sm">{PROPERTY.address}, {PROPERTY.subdivision}, {PROPERTY.city}</p></div>
        <div className="text-sm"><p><a className="hover:text-white" href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a></p><p className="mt-1"><a className="hover:text-white" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p></div>
      </div>
      <div className="mt-9 border-t border-neutral-800 pt-6 text-xs leading-relaxed">
        <p>All dimensions, boundaries, structural details, title annotations, tax status, zoning, flood status, and financing eligibility are subject to independent verification. Nothing on this page constitutes a warranty, legal advice, or binding offer.</p>
        <p className="mt-3">Designed and developed by Goodvibes LTD.</p>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-16 text-neutral-950 antialiased md:pb-0">
      <Header scrolled={scrolled} />
      <main>
        <Hero />
        <Highlights />
        <Gallery />
        <Location />
        <Details />
        <Documents />
        <Inquiry />
        <FAQ />
      </main>
      <Footer />
      <MobileBar />
    </div>
  );
}
