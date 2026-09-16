import { StyleOption, VoiceOption, MusicThemeOption } from '../types';

export const STYLES: StyleOption[] = [
  {
    id: 'corporate',
    label: 'Corporate Speech',
    category: 'Business & Executive',
    description: 'Crisp, articulate, confident executive cadence suitable for all-hands, board meetings, and business reports.',
    recommendedVoice: 'Kore',
    recommendedMusic: 'corporate',
    badgeColor: 'border-slate-300 bg-slate-100 text-slate-800',
    iconName: 'Briefcase',
    promptDirective: 'executive, crisp, articulate, and confident corporate leadership style with polished professional cadence'
  },
  {
    id: 'product_launch',
    label: 'Product Launch',
    category: 'Keynote & Tech',
    description: 'Electrifying excitement, high anticipation, bold visionary punch, and modern innovation vibe.',
    recommendedVoice: 'Puck',
    recommendedMusic: 'product_launch',
    badgeColor: 'border-amber-300 bg-amber-50 text-amber-900',
    iconName: 'Sparkles',
    promptDirective: 'energetic keynote excitement, visionary enthusiasm, high anticipation, and inspiring punch'
  },
  {
    id: 'fun',
    label: 'Fun & Playful',
    category: 'Social & Youth',
    description: 'Upbeat, bright, smiling, and lively delivery full of joy and contagious energy.',
    recommendedVoice: 'Puck',
    recommendedMusic: 'fun',
    badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    iconName: 'Smile',
    promptDirective: 'lively, upbeat, playful, and cheerful tone bursting with warm energy and smiles'
  },
  {
    id: 'creative',
    label: 'Creative & Artistic',
    category: 'Art & Design',
    description: 'Imaginative, expressive, poetic cadence with nuanced vocal color and artistic pacing.',
    recommendedVoice: 'Zephyr',
    recommendedMusic: 'creative',
    badgeColor: 'border-sky-300 bg-sky-50 text-sky-900',
    iconName: 'Palette',
    promptDirective: 'imaginative, expressive, poetic, and whimsical voice with rich artistic color and pacing'
  },
  {
    id: 'storytelling',
    label: 'Storytelling & Cinematic',
    category: 'Narrative & Audiobooks',
    description: 'Immersive, dramatic, warm narrative voice with deliberate pauses, emotional weight, and suspense.',
    recommendedVoice: 'Fenrir',
    recommendedMusic: 'storytelling',
    badgeColor: 'border-orange-300 bg-orange-50 text-orange-900',
    iconName: 'BookOpen',
    promptDirective: 'captivating, immersive, cinematic storyteller with dramatic pauses, emotional depth, and atmospheric intrigue'
  },
  {
    id: 'calm',
    label: 'Calm & Mindful',
    category: 'Wellness & Meditation',
    description: 'Gentle, soothing, resonant, and tranquil tone paced for meditation and mindful reflection.',
    recommendedVoice: 'Zephyr',
    recommendedMusic: 'calm',
    badgeColor: 'border-teal-300 bg-teal-50 text-teal-900',
    iconName: 'Wind',
    promptDirective: 'serene, mindful, gentle, and soothing tone with calm steady pacing and warm resonance'
  },
  {
    id: 'news',
    label: 'News Anchor',
    category: 'Broadcast & Media',
    description: 'Authoritative, fast-paced, neutral, and clear broadcast delivery for briefings and updates.',
    recommendedVoice: 'Charon',
    recommendedMusic: 'corporate',
    badgeColor: 'border-zinc-300 bg-zinc-100 text-zinc-800',
    iconName: 'Radio',
    promptDirective: 'authoritative, objective, articulate broadcast news anchor style with clean measured delivery'
  }
];


export const VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female / Neutral',
    character: 'Crisp, articulate, balanced, and reassuring',
    bestFor: 'Corporate briefings, explanatory videos, modern product walkthroughs'
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Dynamic',
    character: 'High-energy, spirited, charismatic, and youthful',
    bestFor: 'Product launches, social media promos, comedy, enthusiastic commercials'
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male / Neutral',
    character: 'Deep, rich, resonant, and commanding',
    bestFor: 'Cinematic trailers, epic audiobooks, authoritative documentaries'
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female / Neutral',
    character: 'Calm, gentle, velvet-smooth, and intimate',
    bestFor: 'Mindfulness guides, poetic reflections, bedtime stories, luxury branding'
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male / Neutral',
    character: 'Grounded, serious, measured, and distinguished',
    bestFor: 'Journalism, financial reports, historical narratives, academic lectures'
  }
];

export const MUSIC_THEMES: MusicThemeOption[] = [
  {
    id: 'corporate',
    title: 'Executive Horizon',
    subtitle: 'Minimalist warm acoustic piano chords, subtle sub-bass, and refined ambient pulse',
    bpm: 96,
    mood: 'Inspiring & Sophisticated',
    instruments: ['Grand Piano', 'Warm Pad', 'Soft Electronic Pulse']
  },
  {
    id: 'product_launch',
    title: 'Future Velocity',
    subtitle: 'Energetic modern synth arpeggios, forward momentum beat, and tech anticipation',
    bpm: 122,
    mood: 'Dynamic & Visionary',
    instruments: ['Analog Synth Plucks', 'Punchy Sub Kick', 'Ping-Pong Delay']
  },
  {
    id: 'fun',
    title: 'Sunny Bounce',
    subtitle: 'Joyful acoustic guitar strums, cheerful marimba notes, and light handclap rhythm',
    bpm: 112,
    mood: 'Playful & Uplifting',
    instruments: ['Acoustic Plucks', 'Bright Marimba', 'Light Percussion']
  },
  {
    id: 'creative',
    title: 'Curious Sparks',
    subtitle: 'Indie electric Rhodes keys, whimsical vibraphone melodies, and organic warmth',
    bpm: 100,
    mood: 'Artistic & Thoughtful',
    instruments: ['Electric Piano', 'Vibraphone Chimes', 'Gentle Shaker']
  },
  {
    id: 'storytelling',
    title: 'Fireside Strings',
    subtitle: 'Atmospheric cinematic cello swells, delicate emotional piano notes, and suspense',
    bpm: 74,
    mood: 'Cinematic & Emotive',
    instruments: ['Legato Cello', 'Chamber Strings', 'Atmospheric Reverberation']
  },
  {
    id: 'calm',
    title: 'Zen Breath',
    subtitle: 'Peaceful harmonic drone, singing bowl resonance, and soft ocean swell filters',
    bpm: 60,
    mood: 'Tranquil & Meditative',
    instruments: ['Singing Bowl Chime', 'Ambient Drone', 'Filtered Binaural Sweep']
  },
  {
    id: 'none',
    title: 'Voice Only (No Music)',
    subtitle: 'Pure studio acapella narration with no background soundtrack',
    bpm: 0,
    mood: 'Clean & Direct',
    instruments: ['Acapella Speech']
  }
];

export const SCRIPT_TEMPLATES = [
  {
    id: 'corporate_all_hands',
    title: 'Executive All-Hands',
    style: 'corporate' as const,
    voice: 'Kore' as const,
    music: 'corporate' as const,
    text: `Good morning everyone, and welcome to our Q3 company all-hands. Over the past twelve weeks, our engineering and product teams executed with unprecedented focus. We expanded our enterprise platform to five new international markets, reduced customer onboarding latency by forty-two percent, and welcomed over sixty thousand new active teams. As we enter the next fiscal quarter, our primary commitment remains simple: empowering every organization to build faster, smarter, and with complete operational integrity. Thank you for your relentless dedication.`
  },
  {
    id: 'product_keynote',
    title: 'Next-Gen Product Launch',
    style: 'product_launch' as const,
    voice: 'Puck' as const,
    music: 'product_launch' as const,
    text: `Today, we are thrilled to unveil something entirely new. Meet Nova: the world’s first intelligent creative studio built from the ground up for real-time human collaboration. Nova doesn't just assist your workflow—it anticipates your next breakthrough. Instant rendering, zero latency, and seamless multi-device synchronization. This isn't an incremental update. This is the new standard of creation. Nova is available globally starting today.`
  },
  {
    id: 'fun_podcast',
    title: 'Fun & Playful Promo',
    style: 'fun' as const,
    voice: 'Puck' as const,
    music: 'fun' as const,
    text: `Hey there, curious minds! Welcome back to another episode of Brain Snack, the weekly show where we turn wacky everyday questions into mind-blowing discoveries! Ever wondered why your dog tilts its head when you talk, or why we can never tickle ourselves? Grab your favorite coffee or iced matcha, sit back, and let's jump straight into today's awesome adventure!`
  },
  {
    id: 'cinematic_story',
    title: 'Cinematic Lore Prologue',
    style: 'storytelling' as const,
    voice: 'Fenrir' as const,
    music: 'storytelling' as const,
    text: `For three hundred winters, the Great Beacon burned atop the obsidian cliffs of Oakhaven. It guided lost sailors through storms that could swallow galleons whole. But on the night of the second crescent moon, the light flickered once—and vanished into impenetrable mist. Deep beneath the roots of the ancient forest, something long forgotten had finally awakened.`
  },
  {
    id: 'calm_meditation',
    title: 'Mindful Morning Reset',
    style: 'calm' as const,
    voice: 'Zephyr' as const,
    music: 'calm' as const,
    text: `Take a gentle, slow breath in through your nose... allowing your shoulders to soften, and your chest to naturally expand. Hold that stillness for a gentle count of two... and now, release that breath slowly through your mouth. Notice the sensation of weight dissolving from your forehead down to your fingertips. This moment belongs entirely to you. You are centered, present, and calm.`
  },
  {
    id: 'long_deck',
    title: 'Full 5-Slide Keynote (Long Form)',
    style: 'corporate' as const,
    voice: 'Kore' as const,
    music: 'corporate' as const,
    text: `Slide 1: Executive Vision & Annual Transformation
Welcome everyone. Today we reflect on twelve months of unprecedented innovation across our platform. When we set out in January, our ambition was clear: redefine how modern enterprises communicate and operate at planetary scale.

Slide 2: Global Growth & Record Adoption
Over the past four quarters, our active customer community expanded by one hundred and eighty percent across forty-two countries. Net revenue retention reached an all-time high of one hundred and thirty-four percent, led by strong adoption in financial services, healthcare, and high-growth technology sectors.

Slide 3: Next-Generation Architecture
Our engineering teams completely rebuilt our core processing pipeline. We introduced a decentralized inference mesh that cuts response latency by eighty-five percent, while reducing infrastructure operational expenditure by thirty percent. Reliability metrics now consistently exceed ninety-nine point nine nine percent uptime.

Slide 4: Upcoming Strategic Horizons
Looking toward next year, our focus sharpens on three key frontiers: automated workflow orchestration, real-time multilingual localized synthesis, and hardened zero-trust data sovereignty. We are actively expanding partnerships with premier cloud ecosystems to accelerate global distribution.

Slide 5: Closing Acknowledgments & Momentum
None of this would have been achievable without the relentless creativity and commitment of every single person across our organization. Thank you for your dedication. Together, let us continue building the standard of tomorrow.`
  }
];

export const RAW_MESSY_SAMPLES = [
  {
    label: '5-Slide Deck (Long)',
    text: `Slide 1: Q4 Global All-Hands
welcome everyone. today we are going over our annual progress and roadmap for the next three quarters.
Slide 2: Revenue and Retention
our active customer base grew 140% this year across 30 countries! churn dropped to an all time low of under 1.2%, which is incredible for enterprise SaaS.
Slide 3: Core Technology Breakthroughs
we upgraded our audio pipeline to low-latency neural synthesis. response times dropped from 2 seconds down to 300 milliseconds.
Slide 4: Roadmap 2027
1. full multi-speaker dialog generation
2. instant background soundtrack auto-syncing
3. enterprise single sign on and SOC2 compliance
Slide 5: Wrap up
huge thanks to our engineering and design teams for pulling this off. let's open it up for questions!`
  },
  {
    label: 'Slide Deck Notes',
    text: `Slide 1: Q3 Company Review & Roadmap
Hey everyone, thanks for joining today. slide 2 - product growth
Last month our user count grew by 35% which beat our targets! but we noticed onboarding drops on mobile...
Slide three: key priorities
1. fix mobile signup flow
2. ship dark mode and offline sync
3. expand enterprise tier
Slide 4: wrap up. thank you all for the great work let's keep crushing it`
  },
  {
    label: 'Messy Keynote Draft',
    text: `Announcement draft v2:
today we are introducing Horizon X. it is our fastest audio engine ever made.
features:
- zero latency playback
- spatial acoustic rendering
- 40 hour battery life
Slide 2: availability
preorders go live tomorrow morning at 9am. pricing starts at $199.
thank you everyone for making this possible!!`
  },
  {
    label: 'Mindfulness Bullet Notes',
    text: `Step 1: sit comfortably, close your eyes.
Slide 2 - breathing
take a deep breath in through your nose... hold it for 3 seconds.
now breathe out through the mouth. relax your jaw and shoulders.
repeat this 3 times. you are grounded and calm.`
  }
];

