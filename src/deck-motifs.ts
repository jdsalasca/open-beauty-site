import type { StyleSlug } from './types.js';

const motifs: Record<StyleSlug, string> = {
  renaissance: `.deck.style-renaissance .atmosphere:before{width:48vw;height:58vh;right:-12vw;top:10vh;border:1px solid var(--accent);border-radius:50% 50% 0 0;opacity:.45}
.deck.style-renaissance .atmosphere:after{width:1px;height:70vh;right:12vw;top:16vh;background:var(--accent);opacity:.35}`,
  brutalist: `.deck.style-brutalist .atmosphere{background-image:linear-gradient(color-mix(in srgb,var(--ink) 10%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--ink) 10%,transparent) 1px,transparent 1px);background-size:44px 44px}
.deck.style-brutalist .atmosphere:after{width:34vw;height:34vw;max-width:420px;max-height:420px;right:-7vw;bottom:-9vw;background:var(--accent);transform:rotate(-8deg)}
.deck.style-brutalist .point{box-shadow:8px 8px 0 var(--ink)}`,
  papercraft: `.deck.style-papercraft .atmosphere{background:var(--accent2);opacity:.1}
.deck.style-papercraft .atmosphere:before{width:29vw;height:29vw;right:5vw;top:10vh;border-radius:50%;background:var(--accent4);opacity:.42}
.deck.style-papercraft .point{box-shadow:0 18px 30px rgba(74,58,50,.16)}`,
  artdeco: `.deck.style-artdeco .atmosphere:before{width:72vw;height:72vw;right:-18vw;top:-16vw;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 12deg,color-mix(in srgb,var(--accent) 30%,transparent) 12deg 13deg,transparent 13deg 24deg);opacity:.8}
.deck.style-artdeco .atmosphere:after{inset:5vh 4vw;border:1px solid var(--accent);opacity:.45}
.deck.style-artdeco h1{text-transform:uppercase;letter-spacing:.05em;line-height:1.02}`,
  isotype: `.deck.style-isotype .atmosphere{background-image:repeating-linear-gradient(0deg,color-mix(in srgb,var(--ink) 12%,transparent) 0 1px,transparent 1px 52px),repeating-linear-gradient(90deg,color-mix(in srgb,var(--ink) 12%,transparent) 0 1px,transparent 1px 52px)}
.deck.style-isotype .atmosphere:after{width:20vw;height:20vw;right:7vw;bottom:10vh;border-radius:50%;background:var(--accent);opacity:.85}`,
  opart: `.deck.style-opart .atmosphere{background:repeating-linear-gradient(45deg,var(--ink) 0 2px,var(--ground) 2px 16px);opacity:.13}
.deck.style-opart .point:nth-child(2){background:var(--accent);color:var(--ground)}
.deck.style-opart .point:nth-child(2) p{color:var(--ground)}`,
  ukiyoe: `.deck.style-ukiyoe .atmosphere:before{width:80vw;height:48vh;left:-10vw;bottom:-18vh;border-radius:50% 50% 0 0;background:var(--accent);opacity:.12;transform:rotate(-4deg)}
.deck.style-ukiyoe .atmosphere:after{width:18vw;height:18vw;right:11vw;top:12vh;border-radius:50%;background:var(--accent2);opacity:.78}`,
  bestiary: `.deck.style-bestiary .atmosphere:before{inset:5vh 4vw;border:1px solid var(--accent);box-shadow:inset 0 0 0 7px var(--ground),inset 0 0 0 8px var(--accent);opacity:.6}
.deck.style-bestiary .atmosphere:after{width:16vw;height:22vw;right:8vw;top:12vh;border:1px solid var(--accent3);border-radius:50% 50% 0 0;opacity:.35}`,
  psychedelic: `.deck.style-psychedelic .atmosphere:before{width:46vw;height:46vw;right:-8vw;top:-8vw;border-radius:46% 54% 38% 62%;background:var(--accent);opacity:.75}
.deck.style-psychedelic .atmosphere:after{width:24vw;height:24vw;left:-5vw;bottom:-6vw;border-radius:60% 40% 52% 48%;background:var(--accent2);opacity:.7}`,
  memphis: `.deck.style-memphis .atmosphere:before{width:22vw;height:22vw;right:7vw;top:13vh;border-radius:50%;background:var(--accent);border:3px solid var(--ink)}
.deck.style-memphis .atmosphere:after{width:18vw;height:9vw;left:5vw;bottom:14vh;background:var(--accent2);border:3px solid var(--ink);transform:rotate(-8deg)}
.deck.style-memphis .point{box-shadow:6px 6px 0 var(--ink)}`,
  vaporwave: `.deck.style-vaporwave .atmosphere{background:linear-gradient(180deg,var(--ground) 0 52%,var(--deep) 52%),linear-gradient(90deg,color-mix(in srgb,var(--accent2) 28%,transparent) 1px,transparent 1px);background-size:auto,52px 52px}
.deck.style-vaporwave .atmosphere:before{width:22vw;height:22vw;right:9vw;top:9vh;border-radius:50%;background:linear-gradient(180deg,var(--accent),var(--accent2))}
.deck.style-vaporwave .atmosphere:after{width:24vw;height:24vw;right:8vw;top:8vh;border-radius:50%;background:repeating-linear-gradient(180deg,transparent 0 9%,var(--ground) 9% 13%)}
.deck.style-vaporwave .point{box-shadow:inset 2px 2px 0 rgba(255,255,255,.35),inset -2px -2px 0 rgba(0,0,0,.35)}`,
  nature: `.deck.style-nature .atmosphere:before{width:42vw;height:42vw;right:-8vw;bottom:-10vw;border-radius:50%;background:var(--accent);opacity:.12;box-shadow:0 0 0 18px color-mix(in srgb,var(--accent3) 12%,transparent),0 0 0 36px color-mix(in srgb,var(--accent4) 10%,transparent)}
.deck.style-nature .atmosphere:after{width:28vw;height:34vh;right:7vw;top:12vh;border:1px solid var(--accent2);border-radius:50% 50% 0 0;opacity:.35}
.deck.style-nature .point{box-shadow:0 18px 40px rgba(36,48,38,.14)}`,
  galactic: `.deck.style-galactic .atmosphere:before{width:66vw;height:66vw;right:-12vw;top:-10vw;border-radius:50%;border:1px solid var(--accent);box-shadow:0 0 0 48px color-mix(in srgb,var(--accent2) 10%,transparent),0 0 0 96px color-mix(in srgb,var(--accent) 8%,transparent)}
.deck.style-galactic .atmosphere:after{width:31vw;height:31vw;right:4vw;top:12vh;border-radius:50%;background:radial-gradient(circle at 38% 32%,var(--accent2),var(--deep) 58%,var(--bg));}
.deck.style-galactic .cover-dot{background:radial-gradient(circle at 38% 32%,var(--accent2),var(--deep) 66%);box-shadow:0 0 90px color-mix(in srgb,var(--accent) 24%,transparent)}`,
};

export function motifFor(slug: StyleSlug): string {
  return motifs[slug];
}
