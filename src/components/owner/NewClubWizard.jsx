import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { resolveFeatures, PRODUCT_TIERS } from '@/config/productTiers';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const SPORTS = [
  { value: 'rugby_league', label: 'Rugby League', emoji: '🏉' },
  { value: 'afl', label: 'AFL', emoji: '🏈' },
  { value: 'soccer', label: 'Soccer', emoji: '⚽' },
  { value: 'cricket', label: 'Cricket', emoji: '🏏' },
  { value: 'netball', label: 'Netball', emoji: '🏐' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
];

const TIER_INFO = {
  starter: { label: 'Starter', blurb: 'Essentials: memberships, day passes, gate scanning' },
  club: { label: 'Club', blurb: 'Rewards, points, merch shop, sponsor dashboard' },
  club_pro: { label: 'Club Pro', blurb: 'Everything in Club + juniors & social posting' },
  elite: { label: 'Elite', blurb: 'Full platform with automations & KPI digest' },
  founder: { label: 'Founder', blurb: 'Elite experience at a founding rate' },
};

const STEPS = ['Identity', 'Branding', 'Product Tier', 'Membership Tiers', 'Review'];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewClubWizard({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    sport: 'rugby_league',
    nickname: '',
    venue: '',
    logoUrl: '',
    primaryColor: '#1a1a2e',
    secondaryColor: '#f59e0b',
    accentColor: '#06b6d4',
    productTier: 'starter',
    tiers: [{ name: 'Full Membership', price: 50 }],
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateName = (name) => {
    setForm(prev => ({ ...prev, name, slug: slugEdited ? prev.slug : slugify(name) }));
  };

  const addTier = () => setForm(prev => ({ ...prev, tiers: [...prev.tiers, { name: '', price: 0 }] }));
  const removeTier = (idx) => setForm(prev => ({ ...prev, tiers: prev.tiers.filter((_, i) => i !== idx) }));
  const updateTier = (idx, key, value) => setForm(prev => ({
    ...prev,
    tiers: prev.tiers.map((t, i) => i === idx ? { ...t, [key]: value } : t)
  }));

  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.slug.trim();
    if (step === 1) return true;
    if (step === 2) return !!form.productTier;
    if (step === 3) return form.tiers.every(t => t.name.trim());
    return true;
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const sportObj = SPORTS.find(s => s.value === form.sport);
      const clubData = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        short_name: form.name.trim(),
        nickname: form.nickname.trim() || form.name.trim(),
        team_short: form.nickname.trim() || form.name.trim().split(' ')[0],
        sport: form.sport,
        sport_emoji: sportObj?.emoji || '🏉',
        status: 'onboarding',
        product_tier: form.productTier,
        venue_name: form.venue.trim(),
        logo_url: form.logoUrl.trim(),
        primary_color: form.primaryColor,
        secondary_color: form.secondaryColor,
        accent_color: form.accentColor,
        features: resolveFeatures(form.productTier),
        onboarding_progress: 100,
        is_active: true,
        timezone: 'Australia/Sydney',
      };
      const club = await base44.entities.Club.create(clubData);

      const validTiers = form.tiers.filter(t => t.name.trim());
      if (validTiers.length > 0) {
        await base44.entities.MembershipTier.bulkCreate(
          validTiers.map((t, i) => ({
            name: t.name.trim(),
            price: Number(t.price) || 0,
            club_id: club.id,
            sort_order: i,
            is_active: true,
          }))
        );
      }
      onComplete();
    } catch (err) {
      setError(err.message || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0f0f17] rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Set Up New Club</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < step ? 'bg-green-500 text-white' : i === step ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/40'
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={`text-xs ${i === step ? 'text-white font-medium' : 'text-white/40'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Club Name *</label>
                <input
                  value={form.name}
                  onChange={e => updateName(e.target.value)}
                  placeholder="e.g. Central Newcastle RLFC"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Slug (URL identifier) *</label>
                <input
                  value={form.slug}
                  onChange={e => { setSlugEdited(true); update('slug', slugify(e.target.value)); }}
                  placeholder="central-newcastle"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Sport</label>
                <select
                  value={form.sport}
                  onChange={e => update('sport', e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                >
                  {SPORTS.map(s => <option key={s.value} value={s.value} className="bg-[#0f0f17]">{s.emoji} {s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Nickname</label>
                <input
                  value={form.nickname}
                  onChange={e => update('nickname', e.target.value)}
                  placeholder="e.g. Butcher Boys"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Home Venue</label>
                <input
                  value={form.venue}
                  onChange={e => update('venue', e.target.value)}
                  placeholder="e.g. St John Oval"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/60 mb-1.5 block">Logo URL</label>
                <input
                  value={form.logoUrl}
                  onChange={e => update('logoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'primaryColor', label: 'Primary' },
                  { key: 'secondaryColor', label: 'Secondary' },
                  { key: 'accentColor', label: 'Accent' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-white/60 mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-2 py-1.5">
                      <input
                        type="color"
                        value={form[key]}
                        onChange={e => update(key, e.target.value)}
                        className="w-8 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs text-white/50 font-mono">{form[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Live preview */}
              <div className="rounded-xl p-5 flex items-center gap-4" style={{ background: form.primaryColor }}>
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-white/20" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold text-white">
                    {(form.name || '?')[0]}
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: form.secondaryColor }}>
                    {form.sport_emoji || '🏉'} {form.sport || 'Sport'}
                  </p>
                  <h3 className="text-white text-lg font-bold">{form.name || 'Your Club Name'}</h3>
                  <p className="text-xs" style={{ color: form.accentColor }}>{form.nickname || 'Nickname'}</p>
                </div>
                <button
                  className="ml-auto px-4 py-2 rounded-lg text-sm font-bold"
                  style={{ background: form.secondaryColor, color: form.primaryColor }}
                >
                  Join
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {Object.entries(TIER_INFO).map(([key, info]) => {
                const selected = form.productTier === key;
                const features = PRODUCT_TIERS[key];
                const enabledCount = Object.values(features).filter(Boolean).length;
                return (
                  <button
                    key={key}
                    onClick={() => update('productTier', key)}
                    className={`w-full text-left rounded-xl p-4 border transition-all ${
                      selected ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{info.label}</p>
                        <p className="text-xs text-white/50 mt-0.5">{info.blurb}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {Object.entries(features).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                          {k.replace(/_/g, ' ')}
                        </span>
                      ))}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">
                        {enabledCount} features
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-white/50 mb-2">Set up the membership tiers this club will offer. You can add more later.</p>
              {form.tiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/10 p-3">
                  <input
                    value={tier.name}
                    onChange={e => updateTier(idx, 'name', e.target.value)}
                    placeholder="Tier name e.g. Full Membership"
                    className="flex-1 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-white/40">$</span>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={e => updateTier(idx, 'price', e.target.value)}
                      className="w-20 rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <button onClick={() => removeTier(idx)} className="text-white/30 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addTier}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add tier
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Name</span>
                  <span className="text-white font-medium">{form.name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Slug</span>
                  <span className="text-white font-mono">{form.slug || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Sport</span>
                  <span className="text-white">{form.sport}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Venue</span>
                  <span className="text-white">{form.venue || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Product tier</span>
                  <span className="text-white capitalize">{TIER_INFO[form.productTier]?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Brand colors</span>
                  <div className="flex gap-1.5">
                    <span className="w-4 h-4 rounded-full" style={{ background: form.primaryColor }} />
                    <span className="w-4 h-4 rounded-full" style={{ background: form.secondaryColor }} />
                    <span className="w-4 h-4 rounded-full" style={{ background: form.accentColor }} />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-white/50">Membership tiers</span>
                  <div className="mt-1.5 space-y-1">
                    {form.tiers.filter(t => t.name.trim()).map((t, i) => (
                      <div key={i} className="flex justify-between text-white">
                        <span>{t.name}</span>
                        <span>${t.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/40">
                The club will be created with status <span className="text-amber-400">onboarding</span> and 100% onboarding progress.
                You can activate it once the club is ready to go live.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {error && (
          <div className="px-6 pb-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 4 ? (
            <button
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-black disabled:opacity-30 hover:bg-amber-400"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold bg-green-500 text-black disabled:opacity-50 hover:bg-green-400"
            >
              {creating ? 'Creating...' : <><Check className="w-4 h-4" /> Create Club</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}