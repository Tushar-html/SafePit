import { Language } from "./index";

/* ============================================================
   moduleLines — AR module step descriptions in all 3 languages.

   Keyed "<module>:<itemIndex>:<lineIndex>", value [en, hi, sat].
   The AR modules display + narrate the entry for the user's
   language, falling back to English when a string is missing.

   NOTE on Santali (sat): phone TTS engines cannot read Ol Chiki,
   so when the app language is Santali the HINDI text of the same
   key is what the voice engine speaks (see ARShell voiceText).
   ============================================================ */

type Tri = [en: string, hi: string, sat: string];

const L: Record<string, Tri> = {
  /* ================= FIRE (7 fires × 5 lines) ================= */
  "fire:0:0": [
    "Slender, pale blue-violet flame with a whitish-blue core, standing 6–12 inches tall.",
    "छह से बारह इंच ऊँचा दुबला हल्का नीला-बैंगनी ज्वाला, जिसका केंद्र सफ़ेद-नीला होता है।",
    "ᱦᱩᱰᱤᱧ ᱱᱤᱞ ᱯᱷᱟᱞᱟᱢ, ᱛᱟᱞᱟ ᱫᱚ ᱯᱩᱸᱰ ᱱᱤᱞᱟ, ᱛᱩᱭᱩ ᱠᱷᱚᱱ ᱜᱚᱞ ᱵᱟᱨ ᱤᱱᱪ ᱩᱥᱩᱞᱟ।",
  ],
  "fire:0:1": [
    "Flickers and dances erratically rather than standing still.",
    "एक जगह टिकता नहीं, अनियमित रूप से फड़फड़ाता और नाचता है।",
    "ᱛᱷᱟᱹᱯ ᱛᱟᱦᱮᱸᱱᱟ ᱵᱟᱝᱟ, ᱞᱟᱹᱴ ᱟᱹᱪᱩᱨ ᱞᱟᱲᱟᱜᱼᱟ।",
  ],
  "fire:0:2": [
    "Almost translucent near the base, becoming wispy and faint toward the tip.",
    "तले के पास लगभग पारदर्शी, ऊपर की ओर धुँधला और फीका पड़ता जाता है।",
    "ᱞᱟᱛᱟᱨ ᱨᱮ ᱯᱟᱨᱫᱚᱲᱮᱱᱟ, ᱪᱮᱛᱟᱱ ᱥᱮᱫ ᱫᱷᱤᱨᱤ ᱟᱨ ᱧᱩᱨ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:0:3": [
    "Small dancing flame tongues split along roof cracks or floor fissures.",
    "छत की दरारों या फ़र्श की दरारों से छोटी नाचती ज्वाला-जीभें निकलती हैं।",
    "ᱪᱷᱟᱛ ᱨᱮᱭᱟᱜ ᱵᱷᱮᱜᱟᱨ ᱠᱷᱚᱱ ᱦᱩᱰᱤᱧ ᱯᱷᱟᱞᱟᱢ ᱡᱷᱟᱹᱞᱤᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:0:4": [
    "Clean combustion with no soot; only a thin heat-shimmer distortion in the air.",
    "बिना कालिख की स्वच्छ दहन; हवा में बस हल्की गर्मी की लहर दिखती है।",
    "ᱡᱚᱛᱚ ᱯᱩᱸᱰ ᱞᱚᱜᱼᱟ, ᱫᱷᱩᱸᱫᱟᱹ ᱵᱟᱹᱱᱩᱜᱼᱟ, ᱥᱤᱛᱩᱝ ᱦᱟᱹᱣ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:1:0": [
    "Fuller, bright orange-yellow flame with deep red streaks near its base.",
    "भरा हुआ चमकीला नारंगी-पीला ज्वाला, तले के पास गहरी लाल धारियाँ।",
    "ᱢᱟᱨᱟᱝ ᱟᱨᱟᱜ-ᱡᱟᱸᱜᱷᱟ ᱯᱷᱟᱞᱟᱢ, ᱞᱟᱛᱟᱨ ᱨᱮ ᱜᱟᱹᱦᱤᱨ ᱟᱨᱟᱜᱟ।",
  ],
  "fire:1:1": [
    "Jagged tips curl upward; flames may be roughly 1–3 feet tall.",
    "नुकीली चोटियाँ ऊपर मुड़ी हुईं; ज्वाला लगभग 1–3 फुट ऊँची हो सकती है।",
    "ᱪᱮᱛᱟᱱ ᱥᱮᱫ ᱢᱚᱴᱟ ᱛᱮ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ, ᱢᱤᱫ ᱠᱷᱚᱱ ᱯᱮ ᱯᱷᱩᱴ ᱩᱥᱩᱞᱟ।",
  ],
  "fire:1:2": [
    "Dense and opaque flame body, brightest orange in middle, fading to red at edges.",
    "घना अपारदर्शी ज्वाला, बीच में सबसे चमकीला नारंगी, किनारों पर लाल।",
    "ᱡᱷᱟᱸᱠ ᱯᱷᱟᱞᱟᱢ, ᱛᱟᱞᱟ ᱨᱮ ᱟᱹᱰᱤ ᱟᱨᱟᱜ, ᱫᱷᱟᱨᱮ ᱨᱮ ᱧᱩᱨ।",
  ],
  "fire:1:3": [
    "Above it, thick black-grey smoke billows continuously in rolling cauliflower plumes.",
    "इसके ऊपर काला-स्लेटी घना धुआँ लगातार गोल गोल उठता रहता है।",
    "ᱪᱮᱛᱟᱱ ᱨᱮ ᱦᱮᱸᱫᱮ ᱫᱷᱩᱸᱫᱟᱹ ᱵᱟᱝ ᱛᱷᱟᱹᱯ ᱩᱛᱨᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:1:4": [
    "Small glowing embers or sparks drift upward from the flame tips.",
    "ज्वाला की चोटियों से चमकती छोटी अंगारे या चिंगारियाँ ऊपर उड़ती हैं।",
    "ᱪᱮᱛᱟᱱ ᱥᱮᱫ ᱦᱩᱰᱤᱧ ᱞᱚ ᱪᱤᱠᱟᱹᱬ ᱛᱮ ᱯᱮᱨᱮᱡᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:2:0": [
    "No open flame here at all.",
    "यहाँ कोई खुली ज्वाला बिल्कुल नहीं है।",
    "ᱱᱚᱰᱮ ᱡᱷᱟᱲ ᱯᱷᱟᱞᱟᱢ ᱵᱟᱹᱱᱩᱜᱼᱟ।",
  ],
  "fire:2:1": [
    "Dull reddish-orange glow deep within a coal seam or pile.",
    "कोयले की परत या ढेर के भीतर मंद लाल-नारंगी चमक।",
    "ᱠᱳᱭᱞᱟ ᱵᱷᱤᱛᱨᱤ ᱨᱮ ᱢᱚᱱᱰᱟ ᱟᱨᱟᱜ ᱞᱚ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:2:2": [
    "Embers pulse faintly beneath a fractured greyish coal crust.",
    "टूटी स्लेटी कोयले की परत के नीचे अंगारे मंद-मंद चमकते हैं।",
    "ᱵᱷᱟᱝᱜᱟᱣ ᱠᱳᱭᱞᱟ ᱞᱟᱛᱟᱨ ᱨᱮ ᱞᱚ ᱦᱚᱞᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:2:3": [
    "Thin wisps of white-grey smoke or haze seep out slowly and lazily.",
    "सफ़ेद-स्लेटी धुएँ की पतली लकीरें धीरे-धीरे बाहर निकलती हैं।",
    "ᱯᱩᱸᱰ ᱫᱷᱩᱸᱫᱟᱹ ᱞᱟᱹᱴ ᱞᱟᱹᱴ ᱛᱮ ᱡᱷᱟᱹᱞᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:2:4": [
    "Coal surface displays a dusty yellowish-white film of sulphur/ammonium salt deposits.",
    "कोयले की सतह पर पीले-सफ़ेद सल्फ़र/अमोनियम लवण की परत दिखती है।",
    "ᱠᱳᱭᱞᱟ ᱪᱮᱛᱟᱱ ᱨᱮ ᱯᱩᱸᱰ-ᱡᱟᱸᱜᱷᱟ ᱡᱤᱞᱤᱧ ᱯᱷᱤᱞᱢ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:3:0": [
    "Almost no flame is visible on the surface.",
    "सतह पर लगभग कोई ज्वाला नहीं दिखती।",
    "ᱪᱮᱛᱟᱱ ᱨᱮ ᱯᱷᱟᱞᱟᱢ ᱵᱟᱝ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:3:1": [
    "Faint deep-red flicker buried within collapsed rubble, mostly hidden from view.",
    "ढहे मलबे के भीतर दबी मंद गहरी लाल लौ, ज़्यादातर छिपी रहती है।",
    "ᱵᱷᱟᱝᱜᱟᱣ ᱫᱤᱨᱤ ᱵᱷᱤᱛᱨᱤ ᱨᱮ ᱧᱩᱨ ᱟᱨᱟᱜ ᱞᱚ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:3:2": [
    "Dense, heavy black-grey smoke pours out from voids in thick, rolling plumes.",
    "खाली जगहों से घना काला-स्लेटी धुआँ मोटी लहरों में निकलता है।",
    "ᱦᱮᱸᱫᱮ ᱫᱷᱩᱸᱫᱟᱹ ᱡᱷᱟᱸᱠ ᱛᱮ ᱵᱟᱦᱨᱮ ᱩᱛᱨᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:3:3": [
    "Smoke is turbulent and opaque; its source may look yellowish.",
    "धुआँ उथल-पुथल भरा और अपारदर्शी है; इसका स्रोत पीला दिख सकता है।",
    "ᱫᱷᱩᱸᱫᱟᱹ ᱡᱷᱟᱸᱠᱟ, ᱚᱱᱟ ᱛᱮᱭᱟᱜ ᱴᱷᱟᱶ ᱡᱟᱸᱜᱷᱟ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:3:4": [
    "Smoke pulses with a breathing rhythm—surging out strongly, thinning, and surging again.",
    "धुआँ साँस की तरह लहराता है—तेज़ निकलता, पतला होता, फिर निकलता है।",
    "ᱫᱷᱩᱸᱫᱟᱹ ᱦᱟᱹᱯ ᱦᱟᱹᱯ ᱛᱮ ᱵᱟᱦᱨᱮ ᱩᱛᱨᱚᱜ ᱟᱨ ᱛᱷᱟᱹᱯᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:4:0": [
    "Tall, wavy flame 2–4 feet high, deep orange at core with reddish flickering tips.",
    "2–4 फुट ऊँची लहरदार ज्वाला, केंद्र में गहरा नारंगी, चोटियों पर लाल फड़कन।",
    "ᱵᱟᱨ ᱠᱷᱚᱱ ᱯᱳᱱ ᱯᱷᱩᱴ ᱩᱥᱩᱞ ᱟᱨᱟᱜ ᱯᱷᱟᱞᱟᱢᱟ।",
  ],
  "fire:4:1": [
    "Thick, fuel-heavy greasy appearance with smooth, glossy undulating movement.",
    "तेलयुक्त चिकना भारी रूप, चिकनी चमकदार लहरदार गति के साथ।",
    "ᱛᱮᱞ ᱞᱮᱠᱟ ᱪᱤᱠᱟᱹᱬ ᱯᱷᱟᱞᱟᱢ, ᱞᱟᱹᱴ ᱞᱟᱹᱴ ᱞᱟᱲᱟᱜᱼᱟ।",
  ],
  "fire:4:2": [
    "Very dark oily smoke rises in dense, twisting columns.",
    "बहुत काला तेलयुक्त धुआँ घने, घूमते स्तंभों में उठता है।",
    "ᱟᱹᱰᱤ ᱦᱮᱸᱫᱮ ᱫᱷᱩᱸᱫᱟᱹ ᱢᱚᱴᱟ ᱛᱮ ᱪᱮᱛᱟᱱ ᱩᱛᱨᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:4:3": [
    "Very thick smoke almost blots out visibility above the flame zone.",
    "ज्वाला क्षेत्र के ऊपर बहुत घना धुआँ देखने की क्षमता लगभग समाप्त कर देता है।",
    "ᱡᱷᱟᱸᱠ ᱫᱷᱩᱸᱫᱟᱹ ᱛᱮ ᱧᱮᱞ ᱵᱟᱝ ᱧᱟᱢᱚᱜᱼᱟ।",
  ],
  "fire:4:4": [
    "Small droplets or sparks of melting/burning rubber fall from the flame source.",
    "पिघलती/जलती रबर की छोटी बूँदें या चिंगारियाँ ज्वाला से गिरती हैं।",
    "ᱯᱤᱜᱽᱞᱟᱣ ᱨᱟᱵᱚᱨ ᱪᱤᱠᱟᱹᱬ ᱞᱟᱛᱟᱨ ᱞᱤᱸᱜᱤᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:5:0": [
    "Low, creeping flame, faint blue-grey in color, barely rising above ore surface.",
    "नीची रेंगती ज्वाला, हल्की नीली-स्लेटी, अयस्क की सतह से बस ऊपर तक।",
    "ᱦᱩᱰᱤᱧ ᱱᱤᱞ ᱯᱷᱟᱞᱟᱢ ᱚᱛ ᱨᱮ ᱞᱟᱹᱴᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:5:1": [
    "Almost flat and ground-hugging rather than tall, spreading slowly across the ore pile.",
    "ऊँची नहीं, लगभग चपटी और ज़मीन से लिपटी, अयस्क के ढेर पर धीरे फैलती है।",
    "ᱚᱛ ᱥᱟᱶ ᱞᱟᱹᱴ ᱠᱟᱛᱮ ᱞᱟᱹᱴ ᱛᱮ ᱟᱹᱪᱩᱨᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:5:2": [
    "Smoke is thin and bluish-white, drifting in slow, straight wisps rather than billowing.",
    "धुआँ पतला और नीला-सफ़ेद, गोल उठने की बजाय धीमी सीधी लकीरों में बहता है।",
    "ᱫᱷᱩᱸᱫᱟᱹ ᱦᱩᱰᱤᱧ ᱯᱩᱸᱰᱟ, ᱞᱟᱹᱴ ᱥᱤᱫᱽ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:5:3": [
    "Visible shimmer of heat around the creeping flame edge.",
    "रेंगती ज्वाला के किनारे चारों ओर गर्मी की झिलमिलाहट दिखती है।",
    "ᱯᱷᱟᱞᱟᱢ ᱟᱲᱮ ᱨᱮ ᱥᱤᱛᱩᱝ ᱦᱟᱹᱣ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:5:4": [
    "Surrounding ore surface shows a pale yellowish crust of sulphur residue.",
    "आसपास की अयस्क सतह पर पीली सल्फ़र की परत दिखती है।",
    "ᱟᱲᱮ ᱚᱛ ᱨᱮ ᱡᱟᱸᱜᱷᱟ ᱥᱟᱞᱯᱷᱟᱨ ᱯᱷᱤᱞᱢ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:6:0": [
    "Short, intensely bright white to yellow-white flame, almost blinding at its core.",
    "छोटी, बेहद चमकीली सफ़ेद से पीली-सफ़ेद ज्वाला, केंद्र में आँखें चुंधिया देने वाली।",
    "ᱦᱩᱰᱤᱧ ᱯᱩᱸᱰ ᱯᱷᱟᱞᱟᱢ, ᱛᱟᱞᱟ ᱫᱚ ᱟᱹᱰᱤ ᱯᱮᱴᱮᱡ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "fire:6:1": [
    "No taller than a few inches, but extremely concentrated and sharp-edged rather than wavy.",
    "कुछ इंच से ऊँची नहीं, पर लहरदार नहीं — बेहद संकेंद्रित और नुकीली।",
    "ᱛᱤᱭᱮ ᱤᱱᱪ ᱵᱷᱤᱛᱨᱤ, ᱡᱷᱟᱸᱠ ᱟᱨ ᱥᱤᱫᱽᱟ, ᱞᱟᱹᱴ ᱵᱟᱝᱟ।",
  ],
  "fire:6:2": [
    "Rapid bursts of brilliant white-yellow sparks shoot outward in firework-like arcs.",
    "चमकीली सफ़ेद-पीली चिंगारियाँ आतिशबाज़ी जैसी तीरों में बाहर छलाँगती हैं।",
    "ᱯᱩᱸᱰ ᱪᱤᱠᱟᱹᱬ ᱯᱮᱨᱮᱡ ᱠᱟᱛᱮ ᱟᱲᱮ ᱛᱮ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "fire:6:3": [
    "Very little smoke is present; only a faint grey wisp directly above the arc point.",
    "बहुत थोड़ा धुआँ; आर्क बिंदु के ठीक ऊपर बस हल्की स्लेटी लकीर।",
    "ᱫᱷᱩᱸᱫᱟᱹ ᱵᱟᱹᱲᱤᱡ ᱠᱚᱢᱟ, ᱪᱮᱛᱟᱱ ᱨᱮ ᱢᱚᱱᱰᱟ ᱫᱷᱩᱸᱫᱟᱹᱜᱼᱟ।",
  ],
  "fire:6:4": [
    "Surrounding area displays scorch marks, blackened steel, and glowing hot metal.",
    "आसपास जले निशान, काली पड़ी स्टील और तपती चमकती धातु दिखती है।",
    "ᱟᱲᱮ ᱨᱮ ᱞᱚ ᱪᱤᱱᱦᱟᱹ, ᱦᱮᱸᱫᱮ ᱥᱴᱤᱞ ᱟᱨ ᱞᱚ ᱫᱷᱟᱛᱩ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],

  /* ================= EXPLOSION (6 × 5) ================= */
  "explo:0:0": [
    "Near-instantaneous expanding fireball with a pale blue core and bright orange-yellow outer edge.",
    "लगभग तात्कालिक फैलती आग की गेंद — हल्का नीला केंद्र, चमकीला नारंगी-पीला किनारा।",
    "ᱞᱚᱜᱚᱱ ᱢᱟᱨᱟᱝ ᱥᱤᱠ ᱜᱚᱞᱟ, ᱛᱟᱞᱟ ᱱᱤᱞᱟ, ᱫᱷᱟᱨᱮ ᱟᱨᱟᱜ-ᱡᱟᱸᱜᱷᱟᱟ।",
  ],
  "explo:0:1": [
    "Thin sheet-like flame front races along the roof line first where lighter methane pools.",
    "पहले पतली चादर जैसी ज्वाला छत की रेखा पर दौड़ती है, जहाँ हल्का मीथेन जमा रहता है।",
    "ᱢᱟᱲᱟᱝ ᱪᱷᱟᱛ ᱥᱮᱫ ᱯᱷᱟᱞᱟᱢ ᱞᱚᱜᱚᱱ ᱥᱮᱱᱚᱜᱼᱟ, ᱡᱟᱞᱟ ᱛᱷᱟᱱ ᱨᱮ ᱢᱮᱛᱷᱮᱱ ᱛᱟᱦᱮᱸᱱᱟ।",
  ],
  "explo:0:2": [
    "Thickens rapidly into a spherical orange-red fireball spanning roadway dimensions before collapsing inward.",
    "जल्दी मोटी होकर सड़क-आकार की नारंगी-लाल गोल आग बनती है, फिर भीतर सिमटती है।",
    "ᱞᱚᱜᱚᱱ ᱢᱟᱨᱟᱝ ᱜᱚᱞᱟ ᱛᱮᱭᱟᱨᱚᱜᱼᱟ, ᱛᱟᱭᱚᱢ ᱵᱷᱤᱛᱨᱤ ᱛᱮ ᱵᱩᱡᱷᱚᱜᱼᱟ।",
  ],
  "explo:0:3": [
    "Fast-moving shimmering shockwave ring trails ahead, pushing dust and loose rock outward.",
    "आगे चमकती झटका-लहर की अँगूठी दौड़ती है, धूल और ढीली चट्टानें बाहर धकेलती है।",
    "ᱢᱟᱲᱟᱝ ᱦᱟᱹᱣ ᱟᱹᱪᱩᱨ ᱟᱹᱭᱲᱤ, ᱫᱷᱩᱲᱟᱹ ᱟᱨ ᱫᱤᱨᱤ ᱟᱲᱮ ᱛᱮ ᱛᱷᱤᱛᱚᱜᱼᱟ।",
  ],
  "explo:0:4": [
    "Followed immediately by thick, turbulent grey-black smoke rapidly filling the mine roadway.",
    "तुरंत बाद घना उथल-पुथल भरा स्लेटी-काला धुआँ सुरंग भर देता है।",
    "ᱚᱱᱟ ᱛᱟᱭᱚᱢ ᱡᱷᱟᱸᱠ ᱦᱮᱸᱫᱮ ᱫᱷᱩᱸᱫᱟᱹ ᱥᱟᱹᱨᱤ ᱛᱮ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ।",
  ],
  "explo:1:0": [
    "Rolling, self-propagating wall of orange-red flame moving in a continuous advancing wave.",
    "नारंगी-लाल ज्वाला की लुढ़कती दीवार, लगातार आगे बढ़ती लहर की तरह।",
    "ᱟᱨᱟᱜ ᱯᱷᱟᱞᱟᱢ ᱫᱤᱣᱟᱹᱨ ᱞᱮᱠᱟ ᱟᱹᱪᱩᱨ ᱢᱟᱲᱟᱝ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "explo:1:1": [
    "Flame front picks up and ignites suspended coal dust ahead, growing larger and more violent.",
    "ज्वाला आगे की उड़ती कोयला धूल पकड़कर जला देती है, और बड़ी व तेज़ होती जाती है।",
    "ᱢᱟᱲᱟᱝ ᱠᱳᱭᱞᱟ ᱫᱷᱩᱲᱟᱹ ᱞᱚᱜᱼᱟ, ᱯᱷᱟᱞᱟᱢ ᱢᱟᱨᱟᱝ ᱟᱨ ᱡᱷᱟᱸᱠᱚᱜᱼᱟ।",
  ],
  "explo:1:2": [
    "Rough, turbulent texture with chunky billowing orange tongues mixed with dark particulate clouds.",
    "खुरदरी उथल-पुथल भरी बनावट — मोटी नारंगी जीभें और काली धूल के बादल मिले हुए।",
    "ᱡᱷᱟᱸᱠ ᱟᱨᱟᱜ ᱯᱷᱟᱞᱟᱢ ᱦᱮᱸᱫᱮ ᱫᱷᱩᱲᱟᱹ ᱥᱟᱶ ᱢᱮᱥᱟᱜ ᱠᱟᱱᱟ।",
  ],
  "explo:1:3": [
    "Dense black smoke and heavy dust clouds trail the flame front, dropping roadway visibility to zero.",
    "ज्वाला के पीछे घना काला धुआँ और भारी धूल — सड़क में देखना लगभग असंभव।",
    "ᱯᱷᱟᱞᱟᱢ ᱛᱟᱭᱚᱢ ᱦᱮᱸᱫᱮ ᱫᱷᱩᱸᱫᱟᱹ, ᱧᱮᱞ ᱵᱟᱝ ᱧᱟᱢᱚᱜᱼᱟ।",
  ],
  "explo:1:4": [
    "Violent blast path scatters splintered timber supports and rock fragments outward.",
    "तेज़ विस्फोट मार्ग में टूटी लकड़ियाँ और चट्टान के टुकड़े बाहर बिखेर देता है।",
    "ᱵᱤᱥᱯᱷᱳᱴ ᱛᱮ ᱠᱟᱴᱠᱚ ᱟᱨ ᱫᱤᱨᱤ ᱟᱲ ᱛᱮ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ।",
  ],
  "explo:2:0": [
    "Two-stage catastrophic event: initiated by a sharp, brilliant blue-white methane ignition flash.",
    "दो-चरणीय विनाशक घटना: पहले तीखी, चमकीली नीली-सफ़ेद मीथेन चमक।",
    "ᱵᱟᱨ ᱛᱷᱚᱠ ᱵᱤᱥᱯᱷᱳᱴ ᱢᱟᱲᱟᱝ ᱱᱤᱞ-ᱯᱩᱸᱰ ᱞᱚ ᱯᱮᱴᱮᱡᱼᱟ।",
  ],
  "explo:2:1": [
    "Immediately triggers and transitions into a massive advancing orange-red coal dust flame wall.",
    "तुरंत विशाल बढ़ती नारंगी-लाल कोयला-धूल ज्वाला दीवार में बदल जाती है।",
    "ᱚᱱᱟ ᱛᱟᱭᱚᱢ ᱢᱟᱨᱟᱝ ᱟᱨᱟᱜ ᱯᱷᱟᱞᱟᱢ ᱫᱤᱣᱟᱹᱨ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "explo:2:2": [
    "Expands violently and elongates down the roadway, consuming airborne dust over great distances.",
    "प्रचंड रूप से फैलती है और लंबी दूरी तक उड़ती धूल निगलती सड़क पर आगे बढ़ती है।",
    "ᱡᱷᱟᱸᱠ ᱛᱮ ᱡᱤᱞᱤᱧ ᱥᱟᱹᱨᱤ ᱛᱮ ᱟᱹᱪᱩᱨᱚᱜᱼᱟ, ᱫᱷᱩᱲᱟᱹ ᱞᱚᱜᱼᱟ।",
  ],
  "explo:2:3": [
    "High-velocity pressure wave and destructive debris field far exceeding single-source events.",
    "तेज़ दबाव लहर और विनाशक मलबा — अकेले विस्फोट से कहीं अधिक भयानक।",
    "ᱡᱷᱟᱸᱠ ᱦᱟᱹᱣ ᱟᱨ ᱢᱟᱨᱟᱝ ᱢᱟᱞ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ।",
  ],
  "explo:2:4": [
    "Complete tunnel atmosphere is overcome with dense opaque smoke, toxic gases, and heavy dust.",
    "पूरी सुरंग घने अपारदर्शी धुएँ, ज़हरीली गैसों और भारी धूल से भर जाती है।",
    "ᱥᱟᱹᱨᱤ ᱯᱮᱨᱮᱡ ᱫᱷᱩᱸᱫᱟᱹ, ᱵᱟᱹᱲᱤᱡ ᱜᱮᱥ ᱟᱨ ᱫᱷᱩᱲᱟᱹ ᱛᱮᱜᱮ ᱛᱟᱦᱮᱸᱱᱟ।",
  ],
  "explo:3:0": [
    "Localized, intensely bright white-orange point-source detonation flash at the blast face.",
    "ब्लास्ट चेहरे पर स्थानीय, अत्यंत चमकीला सफ़ेद-नारंगी बिंदु-विस्फोट।",
    "ᱢᱤᱫ ᱴᱷᱮᱱ ᱯᱩᱸᱰ-ᱟᱨᱟᱜ ᱞᱚ ᱯᱮᱴᱮᱡᱼᱟ।",
  ],
  "explo:3:1": [
    "Short-lived sharp-edged starburst flame pattern rather than an advancing rolling wave.",
    "आगे बढ़ती लहर नहीं — छोटी, नुकीली तारों जैसी फटने वाली ज्वाला।",
    "ᱦᱩᱰᱤ ᱞᱚ ᱛᱟᱨᱟ ᱞᱮᱠᱟ ᱯᱮᱨᱮᱡᱼᱟ, ᱟᱹᱪᱩᱨ ᱵᱟᱝᱟ।",
  ],
  "explo:3:2": [
    "Rock fragments and mineral dust shoot radially outward in a concentrated high-speed cone.",
    "चट्टान के टुकड़े और खनिज धूल तीव्र शंकु में चारों ओर छलाँगते हैं।",
    "ᱫᱤᱨᱤ ᱟᱨ ᱫᱷᱩᱲᱟᱹ ᱟᱲ ᱛᱮ ᱞᱚᱜᱚᱱ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ।",
  ],
  "explo:3:3": [
    "Distinct visible pressure-wave distortion ring expands rapidly from the blast center.",
    "विस्फोट केंद्र से स्पष्ट दबाव-लहर की अँगूठी तेज़ी से फैलती है।",
    "ᱛᱟᱞᱟ ᱠᱷᱚᱱ ᱦᱟᱹᱣ ᱟᱹᱪᱩᱨᱤ ᱢᱟᱨᱟᱝᱚᱜᱼᱟ।",
  ],
  "explo:3:4": [
    "Delayed rolling orange-black secondary cloud forms if airborne coal dust is ignited.",
    "उड़ता कोयला धूल जल जाए तो देर से लुढ़कता नारंगी-काला दूसरा बादल बनता है।",
    "ᱠᱳᱭᱞᱟ ᱫᱷᱩᱲᱟᱹ ᱞᱚᱜ ᱠᱷᱟᱱ ᱫᱚᱥᱟᱨ ᱦᱮᱸᱫᱮ ᱫᱩᱸᱫᱟᱹ ᱛᱮᱭᱟᱨᱚᱜᱼᱟ।",
  ],
  "explo:4:0": [
    "Duller, deep reddish-orange flame front advancing in a rolling wave through ore galleries.",
    "मंद, गहरी लाल-नारंगी ज्वाला की लहर अयस्क गैलरी में आगे बढ़ती है।",
    "ᱢᱚᱱᱰᱟ ᱟᱨᱟᱜ ᱯᱷᱟᱞᱟᱢ ᱞᱟᱹᱴ ᱛᱮ ᱢᱟᱲᱟᱝ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "explo:4:1": [
    "Slower propagation velocity and less luminous than organic coal dust combustions.",
    "कोयला-धूल विस्फोट से धीमा और कम चमकीला।",
    "ᱠᱳᱭᱞᱟ ᱫᱷᱩᱲᱟᱹ ᱠᱷᱚᱱ ᱞᱟᱹᱴ ᱟᱨ ᱧᱩᱨᱟ।",
  ],
  "explo:4:2": [
    "Grainy, speckled flame texture caused by burning sulphide mineral micro-particulates.",
    "जलते सल्फ़ाइड खनिज के सूक्ष्म कणों से दानेदार, चितकबरी ज्वाला।",
    "ᱞᱚ ᱥᱟᱞᱯᱷᱟᱭᱤᱰ ᱫᱷᱩᱲᱟᱹ ᱛᱮ ᱯᱷᱟᱞᱟᱢ ᱯᱩᱴᱠᱤᱞ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "explo:4:3": [
    "Trails a dense, yellowish-brown smoke and toxic sulphur dioxide (SO2) dust cloud.",
    "पीछे घना पीला-भूरा धुआँ और ज़हरीली सल्फ़र डाइऑक्साइड (SO2) धूल का बादल।",
    "ᱛᱟᱭᱚᱢ ᱡᱟᱸᱜᱷᱟ ᱵᱟᱹᱲᱤᱡ ᱫᱩᱸᱫᱟᱹ ᱥᱟᱶᱛᱮ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "explo:4:4": [
    "Extensive irritating sulphur haze expands well beyond the immediate flame and blast boundary.",
    "जलन भरी सल्फ़र धुंध ज्वाला और विस्फोट सीमा से बहुत आगे तक फैलती है।",
    "ᱵᱟᱹᱲᱤᱡ ᱥᱟᱞᱯᱷᱟᱨ ᱫᱩᱸᱫᱟᱹ ᱟᱹᱰᱤ ᱥᱟᱺᱝ ᱛᱮ ᱯᱟᱥᱱᱟᱣᱚᱜᱼᱟ।",
  ],
  "explo:5:0": [
    "Initiated by a sudden mechanical gas outburst violently ejecting fractured coal from the face.",
    "अचानक गैस आउटबर्स्ट से शुरुआत — चेहरे से टूटा कोयला ज़ोर से बाहर फेंका जाता है।",
    "ᱜᱮᱥ ᱡᱷᱟᱴᱠᱟ ᱛᱮ ᱠᱳᱭᱞᱟ ᱯᱮᱨᱮᱡ ᱵᱟᱦᱨᱮᱜᱼᱟ, ᱩᱱᱟ ᱛᱟᱭᱚᱢ ᱞᱚᱜᱼᱟ।",
  ],
  "explo:5:1": [
    "Dense, fast-expanding grey-brown dust cloud forms first with large flying rock chunks.",
    "पहले घना, तेज़ी से फैलता स्लेटी-भूरा धूल का बादल, बड़े उड़ते चट्टान टुकड़ों के साथ।",
    "ᱢᱟᱲᱟᱝ ᱡᱷᱟᱸᱠ ᱫᱩᱸᱫᱟᱹ, ᱢᱟᱨᱟᱝ ᱫᱤᱨᱤ ᱯᱮᱨᱮᱡᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "explo:5:2": [
    "Sudden high-pressure methane/CO2 release saturates the roadway atmosphere within seconds.",
    "अचानक उच्च-दबाव मीथेन/CO2 रिसाव कुछ सेकंड में पूरी सड़क की हवा भर देता है।",
    "ᱜᱮᱥ ᱡᱷᱟᱸᱠ ᱛᱮ ᱥᱟᱹᱨᱤ ᱯᱮᱨᱮᱡᱚᱜᱼᱟ।",
  ],
  "explo:5:3": [
    "Delayed secondary blue-orange ignition tears through the suspended dust-laden gas cloud.",
    "देर से दूसरी नीली-नारंगी आग उड़ते धूल भरे गैस बादल को चीर देती है।",
    "ᱛᱟᱭᱚᱢ ᱱᱤᱞ-ᱟᱨᱟᱜ ᱞᱚ ᱫᱩᱸᱫᱟᱹ ᱵᱷᱤᱛᱨᱤ ᱯᱮᱨᱮᱡᱼᱟ।",
  ],
  "explo:5:4": [
    "Flame appears distinctly 'dirty', with turbulent orange fire visibly churning with mineral dust.",
    "ज्वाला साफ़ तौर पर 'गंदी' दिखती है — नारंगी आग खनिज धूल से घुलमिल रही होती है।",
    "ᱯᱷᱟᱞᱟᱢ ᱫᱩᱲᱟᱹ ᱥᱟᱶ ᱢᱮᱥᱟ ᱵᱟᱝ ᱯᱩᱸᱰᱟ।",
  ],

  /* ================= EXIT ROUTES (4 × 5) ================= */
  "exit:0:0": [
    "Alarm activation: Cap lamp switched to emergency brightness and SCSR self-rescuer clipped.",
    "अलार्म बजते ही कैप लैंप इमरजेंसी रोशनी पर, और SCSR सेल्फ़-रेस्क्यूअर पहन लें।",
    "ᱟᱞᱟᱨᱢ ᱥᱟᱰᱮᱜ ᱠᱷᱚᱱ ᱞᱟᱭᱤᱴ ᱡᱷᱟᱸᱠ ᱢᱮ, SCS ᱦᱟᱛᱟᱣ ᱢᱮ।",
  ],
  "exit:0:1": [
    "Miner walks briskly trailing hand along wall-mounted lifeline rope for directional guidance.",
    "खनिक दीवार की लाइफ़लाइन रस्सी पकड़े तेज़ चलता है — रास्ता जानने के लिए।",
    "ᱫᱤᱣᱟᱹᱨ ᱨᱮᱭᱟᱜ ᱫᱟᱹᱠ ᱥᱟᱵ ᱠᱟᱛᱮ ᱞᱚᱜᱚᱱ ᱟᱹᱪᱩᱨ ᱢᱮ।",
  ],
  "exit:0:2": [
    "Illuminated directional arrow signs highlight route junctions under emergency beam.",
    "इमरजेंसी रोशनी में जलते तीर-चिह्न मार्ग के मोड़ दिखाते हैं।",
    "ᱞᱟᱭᱤᱴ ᱴᱤᱯᱯᱟᱹ ᱪᱤᱱᱦᱟᱹ ᱥᱟᱹᱨᱤ ᱧᱮᱞ ᱧᱟᱢᱚᱜᱼᱟ।",
  ],
  "exit:0:3": [
    "Brief check-in pause at communication alcove to press call button and transmit location.",
    "संचार कक्ष पर छोटा विराम — कॉल बटन दबाकर अपनी जगह भेजें।",
    "ᱠᱚᱞ ᱵᱟᱴᱟᱱ ᱛᱤᱸᱡ ᱠᱟᱛᱮ ᱟᱢᱟᱜ ᱴᱷᱟᱶ ᱵᱷᱮᱡᱟᱣ ᱢᱮ।",
  ],
  "exit:0:4": [
    "Stepping over minor obstacles toward shaft collar to press cage call signal for surface hoist.",
    "छोटी बाधाएँ पार करते हुए शाफ़्ट तक जाकर केज का कॉल सिग्नल दबाएँ।",
    "ᱵᱟᱹᱲᱤᱡ ᱡᱤᱱᱤᱥ ᱯᱟᱨᱚᱢ ᱠᱟᱛᱮ ᱞᱤᱯᱴ ᱴᱷᱮᱱ ᱠᱚᱞ ᱥᱤᱜᱽᱱᱟᱞ ᱛᱤᱸᱡ ᱢᱮ।",
  ],
  "exit:1:0": [
    "Blocked main route detected from heavy smoke/rockfall; miner turns to marked crosscut opening.",
    "घना धुआँ/चट्टानी गिरावट से मुख्य मार्ग बंद — खनिक चिह्नित क्रॉसकट द्वार की ओर मुड़ता है।",
    "ᱡᱸᱠ ᱫᱩᱸᱫᱟᱹ ᱛᱮ ᱥᱟᱹᱨᱤ ᱵᱚᱸᱫ ᱠᱷᱟᱱ ᱫᱚᱥᱟᱨ ᱥᱟᱹᱨᱤ ᱥᱮᱫ ᱟᱹᱪᱩᱨ ᱢᱮ।",
  ],
  "exit:1:1": [
    "Entering narrower alternate tunnel and gripping low-strung lifeline rope as visibility drops.",
    "संकरी वैकल्पिक सुरंग में नीची लाइफ़लाइन रस्सी पकड़े चलें, दृश्यता घटती है।",
    "ᱦᱩᱰᱤᱧ ᱥᱟᱹᱨᱤ ᱨᱮ ᱫᱟᱹᱠ ᱥᱟᱵ ᱠᱟᱛᱮ ᱥᱮᱱ ᱢᱮ।",
  ],
  "exit:1:2": [
    "Snapping emergency glow-stick strobe to illuminate spaced directional cone markers.",
    "इमरजेंसी ग्लो-स्टिक जलाएँ — दूर-दूर रखे दिशा चिह्न दिखें।",
    "ᱜᱽᱞᱚ ᱥᱴᱤᱠ ᱡᱡ ᱢᱮ, ᱥᱟᱹᱨᱤ ᱪᱤᱱᱦᱟᱹ ᱧᱮᱞᱚᱜᱼᱟ।",
  ],
  "exit:1:3": [
    "Sweeping foot forward through standing water puddles to verify solid floor traction.",
    "जमा पानी के डबरे पैर बढ़ाकर जाँचें कि फ़र्श पक्का है।",
    "ᱫᱟᱜ ᱯᱟᱨᱚᱢ ᱠᱟᱛᱮ ᱚᱛ ᱠᱴᱮᱡ ᱠᱟ ᱧᱮᱞ ᱢᱮ।",
  ],
  "exit:1:4": [
    "Activating secondary emergency lighting pull-station to mark the safe path for trailing crews.",
    "पीछे आती टीमों के लिए सुरक्षित मार्ग दिखाने को दूसरा इमरजेंसी लाइटिंग पुल-स्टेशन चालू करें।",
    "ᱛᱟᱭᱚᱢ ᱹᱢᱤᱭᱟᱹ ᱞᱟᱹᱜᱤᱫ ᱞᱟᱭᱤᱴ ᱡᱡ ᱢᱮ।",
  ],
  "exit:2:0": [
    "Shaft collar arrival: Safety harness carabiner clipped onto ladder fall-arrest safety cable.",
    "शाफ़्ट पर पहुँचकर सेफ़्टी हार्नेस की कैरबीनर सीढ़ी की सेफ़्टी केबल से बाँधें।",
    "ᱞᱤᱯᱴ ᱴᱷᱮᱱ ᱥᱮᱯᱷᱴᱤ ᱵᱮᱞᱛᱟ ᱥᱟᱵ ᱢᱮ।",
  ],
  "exit:2:1": [
    "Hand-over-hand climbing on rungs with rhythmic foot placement inside protective cage casing.",
    "सुरक्षा केज के भीतर सीढ़ी पर हाथ बदल-बदलकर, ठीक कदम रखते हुए चढ़ें।",
    "ᱥᱤᱲᱤ ᱛᱮ ᱛᱤ ᱵᱟᱨ ᱛᱮ ᱪᱛᱟᱱ ᱪᱟᱲᱦᱟᱜ ᱢᱮ।",
  ],
  "exit:2:2": [
    "Pausing at 6-meter rest platform to lean against safety cage and verify SCSR oxygen gauge.",
    "6 मीटर के विश्राम प्लेटफ़ॉर्म पर रुककर SCSR की ऑक्सीजन जाँचें।",
    "ᱛᱩᱭᱩ ᱢᱤᱴᱟᱨ ᱴᱷᱮᱱ ᱛᱟᱹᱯ ᱠᱟᱛᱮ ᱚᱠᱥᱤᱡᱱ ᱧᱮᱞ ᱢᱮ।",
  ],
  "exit:2:3": [
    "Unclipping and re-anchoring harness to upper cable segment amidst falling shaft water droplets.",
    "गिरते पानी के बीच हार्नेस खोलकर ऊपरी केबल से दोबारा बाँधें।",
    "ᱫᱟᱜ ᱞᱤᱸᱜᱤ ᱨ ᱦᱚᱸ ᱵᱮᱞᱛᱟ ᱫᱩᱦᱲᱟᱹ ᱥᱟᱵ ᱢᱮ।",
  ],
  "exit:2:4": [
    "Emerging through surface escape hatch into fresh air as natural daylight floods the collar.",
    "ऊपरी एस्केप हैच से निकलकर ताज़ी हवा और दिन की रोशनी में पहुँचें।",
    "ᱪᱛᱟᱱ ᱨ ᱱᱟᱯᱟᱭ ᱦᱟᱹᱣ ᱟᱨ ᱥᱤᱧ ᱫᱤᱱ ᱧᱟᱢᱟ।",
  ],
  "exit:3:0": [
    "Surface escape compromised: Following high-visibility reflective signs directly into chamber alcove.",
    "ऊपर जाना असंभव: चमकीले चिह्नों को फ़ॉलो करते हुए सीधे शेल्टर कक्ष में जाएँ।",
    "ᱪᱛᱟᱱ ᱵᱟᱝ ᱠᱷᱟᱱ ᱪᱤᱱᱦᱟᱹ ᱧᱮᱞ ᱠᱟᱛᱮ ᱠᱚᱢᱨᱟ ᱛᱮ ᱥᱮᱱ ᱢᱮ।",
  ],
  "exit:3:1": [
    "Pulling heavy blast door open against seal, swinging shut, and rotating locking wheel airtight.",
    "भारी दरवाज़ा खोलकर घुसें, बंद करें और लॉकिंग चक्की घुमाकर हवाबंद करें।",
    "ᱵᱟᱲᱟᱜ ᱡᱡ ᱠᱟᱛᱮ ᱵᱷᱤᱛᱨᱤ ᱦᱤᱡᱩᱜ ᱢᱮ, ᱛᱟᱭᱚᱢ ᱵᱚᱸᱫ ᱠᱟᱛᱮ ᱞᱚᱠ ᱟᱹᱪᱩᱨ ᱢᱮ।",
  ],
  "exit:3:2": [
    "Flipping ventilation console switches to initiate positive-pressure purified air overpressure.",
    "वेंटिलेशन के स्विच चालू करके साफ़ हवा का पॉज़िटिव प्रेशर शुरू करें।",
    "ᱦᱟᱹᱣ ᱥᱩᱫᱟᱣ ᱥᱣᱤᱪ ᱡᱡ ᱢᱮ, ᱱᱟᱯᱟᱭ ᱦᱟᱹᱣ ᱦᱟᱢᱟᱞ।",
  ],
  "exit:3:3": [
    "Seated inside hermetic room, opening backup oxygen cylinders and verifying CO2 scrubber gauges.",
    "कक्ष में बैठकर बैकअप ऑक्सीजन सिलेंडर खोलें और CO2 गेज जाँचें।",
    "ᱚᱠᱥᱤᱡᱱ ᱥᱤᱞᱤᱱᱰᱟᱨ ᱡᱡ ᱠᱟᱛᱮ ᱜᱡ ᱧᱮᱞ ᱢᱮ।",
  ],
  "exit:3:4": [
    "Using wall-mounted communications handset with confirming green status light connected to surface.",
    "दीवार के संचार सेट से सतह से संपर्क करें — हरी स्थिति रोशनी देखें।",
    "ᱵᱤᱣᱟᱹᱨ ᱯᱷᱚᱱ ᱛᱮ ᱪᱛᱟᱱ ᱥᱟᱶ ᱡᱚᱲᱟᱣ ᱢᱮ, ᱜᱨᱤᱱ ᱞᱟᱭᱤᱴ ᱧᱮᱞ ᱢᱮ।",
  ],

  /* ================= EXTINGUISHER (7 × 4) ================= */
  "ext:0:0": [
    "Watch the drill: the miner walks in with the extinguisher already gripped in both hands.",
    "ड्रिल देखें: खनिक अग्निशामक दोनों हाथों में पकड़े अंदर आता है।",
    "ᱧᱮᱞ ᱢᱮ ᱠᱟᱹᱢᱤᱭᱟᱹ ᱤᱠᱥᱴᱤᱝᱜᱩᱭᱤᱥᱟᱨ ᱵᱟᱨ ᱛᱤ ᱛᱮ ᱥᱟᱵ ᱠᱟᱛᱮ ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ।",
  ],
  "ext:0:1": [
    "A contained fire burns on a wooden pallet ahead of him.",
    "उसके सामने लकड़ी की पट्टी पर एक छोटी आग जल रही है।",
    "ᱵᱟᱲᱟᱝ ᱨ ᱠᱟᱴ ᱪᱛᱟᱱ ᱦᱩᱰᱤᱧ ᱥᱤᱠ ᱞᱚᱜ ᱠᱟᱱᱟ।",
  ],
  "ext:0:2": [
    "Before approaching any fire, always confirm your escape route stays clear behind you.",
    "आग के पास जाने से पहले हमेशा देखें कि पीछे का निकास मार्ग खुला है।",
    "ᱥᱤᱠ ᱴᱷᱮᱱ ᱵᱟᱲᱟᱝ ᱛᱮᱞᱟᱜ ᱥᱟᱹᱨᱤ ᱠᱷᱩᱞᱟᱹ ᱠᱟ ᱧᱮᱞ ᱢᱮ।",
  ],
  "ext:0:3": [
    "You must do the same: carry the extinguisher ready and keep low — visibility is best near the floor.",
    "आप भी यही करें: अग्निशामक तैयार रखें और झुककर चलें — फ़र्श के पास देखना सबसे साफ़ होता है।",
    "ᱟᱢ ᱦᱚᱸ ᱚᱱᱟ ᱹᱢᱤ ᱢᱮ, ᱞᱟᱛᱟᱨ ᱨ ᱧᱮᱞ ᱱᱟᱯᱟᱭᱟ।",
  ],
  "ext:1:0": [
    "The miner walks straight up to a safe distance — about 2 metres from the fire.",
    "खनिक सुरक्षित दूरी तक सीधा जाता है — आग से लगभग 2 मीटर।",
    "ᱥᱤᱠ ᱠᱷᱚᱱ ᱵᱟᱨ ᱢᱤᱴᱟᱨ ᱥᱟᱺᱝ ᱴᱷᱮᱱ ᱛᱟᱹᱯᱚᱜᱼᱟ।",
  ],
  "ext:1:1": [
    "He stops and stands firm, facing the fire with his back to the open escape path.",
    "वह रुककर दृढ़ खड़ा होता है — आग सामने, खुला निकास पीछे।",
    "ᱛᱟᱹᱯ ᱠᱟᱛᱮ ᱥᱤᱠ ᱥᱮᱫ ᱧᱮᱞᱟ, ᱛᱮᱞᱟᱜ ᱥᱟᱹᱨᱤ ᱥᱮᱫ ᱛᱟᱦᱮᱸᱱᱟ।",
  ],
  "ext:1:2": [
    "You should stop at the same distance — never get closer than needed.",
    "आप भी उतनी ही दूरी पर रुकें — ज़रूरत से करीब न जाएँ।",
    "ᱟᱢ ᱦᱚᱸ ᱚᱱᱟ ᱥᱟᱺᱝ ᱨ ᱛᱟᱹᱯ ᱢᱮ, ᱟᱹᱰᱤ ᱥᱩᱨ ᱵᱟᱝ ᱥᱮᱱ ᱢᱮ।",
  ],
  "ext:1:3": [
    "Stand square, feet apart, ready to act or retreat instantly.",
    "सीधे खड़े रहें, पैर अलग — तुरंत काम या पीछे हटने को तैयार।",
    "ᱥᱤᱫ ᱛᱟᱹᱯ ᱢᱮ, ᱞᱚᱜᱚᱱ ᱠᱟᱹᱢᱤ ᱞᱟᱹᱜᱤᱫ ᱛᱭᱟᱨ।",
  ],
  "ext:2:0": [
    "Next he removes the safety pin — watch his right hand twist and pull the ring out.",
    "अब वह सेफ़्टी पिन निकालता है — दाहिना हाथ घुमाकर रिंग खींचता है।",
    "ᱤᱱᱟ ᱛᱟᱭᱚᱢ ᱥᱮᱯᱷᱴᱤ ᱯᱤᱱ ᱚᱰᱚᱜ ᱢᱮ, ᱛᱤ ᱟᱹᱪᱩᱨ ᱠᱟᱛᱮ ᱚᱰᱚᱜ ᱢᱮ।",
  ],
  "ext:2:1": [
    "The tamper seal breaks and the pin comes free in one firm motion.",
    "सील टूटती है और पिन एक ही ज़ोर से निकल आती है।",
    "ᱥᱤᱞ ᱵᱷᱟᱝᱜᱚᱜᱼᱟ, ᱯᱤᱱ ᱢᱤᱫ ᱡᱴᱠᱟ ᱛᱮ ᱚᱰᱚᱜᱼᱟ।",
  ],
  "ext:2:2": [
    "When you do this, hold the cylinder steady with one hand while pulling the pin with the other.",
    "एक हाथ से सिलेंडर स्थिर पकड़ें, दूसरे से पिन खींचें।",
    "ᱵᱤᱫ ᱛᱤ ᱛᱮ ᱥᱤᱞᱤᱱᱰᱟᱨ ᱥᱟᱵ ᱢᱮ, ᱵᱟᱨ ᱛᱤ ᱛᱮ ᱯᱤᱱ ᱚᱰᱚᱜ ᱢᱮ।",
  ],
  "ext:2:3": [
    "Never squeeze the lever before the pin is out — the handle will not press.",
    "पिन निकाले बिना लीवर कभी न दबाएँ — हैंडल दबेगा नहीं।",
    "ᱤᱱ ᱵᱟᱝ ᱚᱰᱚᱜ ᱠᱷᱚᱱ ᱞᱤᱵᱷᱟᱨ ᱵᱟᱝ ᱛᱤᱸᱡ ᱢᱮ।",
  ],
  "ext:3:0": [
    "Now he raises the nozzle and aims at the BASE of the fire — never the flames' tips.",
    "अब नोज़ल उठाकर आग के तल पर निशाना लगाएँ — कभी ज्वाला की चोटियों पर नहीं।",
    "ᱱᱳᱡᱞ ᱪᱛᱟᱱ ᱠᱟᱛᱮ ᱥᱤᱠ ᱞᱟᱛᱟᱨ ᱥᱮᱫ ᱧᱮᱞ ᱢᱮ, ᱪᱛᱟᱱ ᱵᱟᱝᱟ।",
  ],
  "ext:3:1": [
    "Hitting the top of the flame only spreads burning material around.",
    "ज्वाला के ऊपर मारने से बस जलती सामग्री इधर-उधर फैलती है।",
    "ᱪᱛᱟᱱ ᱨ ᱛᱤᱸᱡᱡ ᱠᱷᱟᱱ ᱥᱤᱠ ᱟᱲ ᱟᱥᱱᱟᱣᱚᱜᱼᱟ।",
  ],
  "ext:3:2": [
    "You must aim the nozzle low, at the base where the fuel is burning.",
    "नोज़ल नीचे, ईंधन के जलने की जगह पर निशाना रखें।",
    "ᱱᱳᱡᱞ ᱞᱟᱛᱟᱨ ᱨ ᱞᱚ ᱴᱷᱮᱱ ᱛᱤᱸᱡᱡ ᱢᱮ।",
  ],
  "ext:3:3": [
    "Keep the hose firm in one hand and the cylinder stable in the other.",
    "एक हाथ में नली मज़बूत, दूसरे में सिलेंडर स्थिर रखें।",
    "ᱵᱤᱫ ᱛᱤ ᱱᱟᱞᱤ ᱥᱟᱵ ᱢᱮ, ᱵᱟᱨ ᱛᱤ ᱥᱤᱞᱤᱱᱰᱟᱨ ᱥᱟᱵ ᱢᱮ।",
  ],
  "ext:4:0": [
    "He squeezes the lever slowly and evenly — white smoke jets onto the fire's base.",
    "वह लीवर धीरे-धीरे दबाता है — सफ़ेद स्प्रे आग के तल पर जाता है।",
    "ᱞᱤᱵᱷᱟᱨ ᱞᱟᱹᱴ ᱛᱮ ᱛᱤᱸᱡᱡ ᱢᱮ, ᱩᱸᱰ ᱷᱩᱸᱫᱟᱹ ᱥᱤᱠ ᱞᱟᱛᱟᱨ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "ext:4:1": [
    "The spray crashes over the flames and begins smothering them immediately.",
    "स्प्रे ज्वाला पर गिरते ही उसे दबाना शुरू कर देता है।",
    "ᱩᱸᱰ ᱷᱩᱸᱫᱟᱹ ᱛᱮ ᱥᱤᱠ ᱵᱩᱡᱚᱜ ᱮᱛᱚᱦᱚᱵᱼᱟ।",
  ],
  "ext:4:2": [
    "Squeeze your lever the same way: press fully and control the jet at the base.",
    "आप भी लीवर पूरा दबाएँ और तल पर फुहार नियंत्रित रखें।",
    "ᱞᱤᱵᱷᱟᱨ ᱩᱨᱟᱹ ᱛᱤᱸᱡᱡ ᱢᱮ, ᱞᱟᱛᱟᱨ ᱨ ᱷᱩᱸᱫᱟᱹ ᱚᱦᱚ ᱢᱮ।",
  ],
  "ext:4:3": [
    "A discharge lasts only seconds — make every moment count.",
    "फुहार मात्र कुछ सेकंड चलती है — हर पल काम आए।",
    "ᱤᱪᱷᱩ ᱥᱮᱠᱱᱰ ᱜᱮ ᱛᱭᱟᱨᱟ, ᱡᱚᱛᱚ ᱚᱠᱛᱚ ᱠᱟᱹᱢᱤ ᱢᱮ।",
  ],
  "ext:5:0": [
    "Watch the flame shrink with every side-to-side sweep of his nozzle.",
    "नोज़ल के हर दाएँ-बाएँ झटके से ज्वाला सिकुड़ती देखें।",
    "ᱱᱳᱡᱞ ᱟᱲ ᱟᱹᱪᱩᱨ ᱢᱮ, ᱥᱤᱠ ᱦᱩᱰᱤᱧᱚᱜᱼᱟ ᱧᱮᱞ ᱢᱮ।",
  ],
  "ext:5:1": [
    "He keeps the jet on the base until the fire is fully knocked down.",
    "आग पूरी बुझने तक फुहार तल पर ही रखें।",
    "ᱥᱤᱠ ᱵᱩᱡᱚᱜ ᱠᱷᱚᱱ ᱞᱟᱛᱟᱨ ᱨᱜᱮ ᱷᱩᱸᱫᱟᱹ ᱚᱦᱚ ᱢᱮ।",
  ],
  "ext:5:2": [
    "Sweep your nozzle slowly across the base of the fire until nothing is left burning.",
    "नोज़ल को आग के तल पर धीरे-धीरे घुमाएँ जब तक कुछ भी न जले।",
    "ᱱᱳᱡᱞ ᱞᱟᱹᱴ ᱛᱮ ᱟᱲ ᱟᱹᱪᱩᱨ ᱢᱮ, ᱥᱤᱠ ᱵᱩᱡᱚᱜ ᱠᱷᱚᱱ ᱦᱟᱹᱵᱤᱡ।",
  ],
  "ext:5:3": [
    "If the fire ever flares back, stop, back away, and never fight a growing fire.",
    "आग दोबारा भड़के तो रुकें, पीछे हटें — बढ़ती आग से कभी न लड़ें।",
    "ᱥᱤᱠ ᱷᱩᱦᱲᱟᱹ ᱞᱚᱜ ᱠᱷᱟᱱ ᱛᱟᱹᱯ ᱠᱟᱛᱮ ᱛᱞᱟᱜ ᱟᱹᱪᱩᱨ ᱢᱮ।",
  ],
  "ext:6:0": [
    "The fire is out — only light smoke drifts off the wet, powder-coated pallet.",
    "आग बुझ गई — गीली पट्टी से बस हल्का धुआँ उड़ रहा है।",
    "ᱥᱤᱠ ᱵᱩᱡ ᱮᱱᱟ, ᱦᱩᱰᱤᱧ ᱷᱩᱸᱫᱟᱹ ᱛᱜᱮ ᱛᱟᱦᱮᱸᱱᱟ।",
  ],
  "ext:6:1": [
    "The miner holds the extinguisher in one hand and gives a thumbs-up: fire defeated.",
    "खनिक एक हाथ में अग्निशामक पकड़े अंगूठा ऊपर उठाता है — आग पराजित।",
    "ᱵᱤᱫ ᱛᱤ ᱛᱮ ᱥᱟᱵ ᱠᱟᱛᱮ ᱟᱝᱜᱩᱴᱷᱟ ᱪᱛᱟᱱ ᱛᱭᱟᱨᱟ ᱥᱤᱠ ᱡᱤᱛᱠᱟᱹᱨ ᱮᱱᱟ।",
  ],
  "ext:6:2": [
    "After extinguishing a fire, always watch the area — re-ignition can occur without warning.",
    "आग बुझाने के बाद जगह पर नज़र रखें — बिना चेतावनी आग फिर भड़क सकती है।",
    "ᱵᱩᱡ ᱛᱟᱭᱚᱢ ᱦᱚᱸ ᱧᱮᱞ ᱢ, ᱷᱩᱦᱲᱟᱹ ᱞᱚᱜ ᱟᱲᱟ।",
  ],
  "ext:6:3": [
    "Report the used extinguisher for recharge and log the incident with your supervisor.",
    "इस्तेमाल हुआ अग्निशामक रिचार्ज के लिए दें और घटना सुपरवाइज़र से दर्ज कराएँ।",
    "ᱠᱥᱴᱤᱝᱜᱩᱭᱤᱥᱟᱨ ᱷᱩᱦᱲᱟᱹ ᱛᱭᱟᱨ ᱞᱟᱹᱜᱤᱫ ᱮᱢ ᱢᱮ, ᱥᱩᱯᱚᱨᱵᱷᱟᱭᱡᱟᱨ ᱠᱷᱚᱱ ᱞᱟᱹᱭ ᱢᱮ।",
  ],

  /* ================= EVACUATION (9 × 4) ================= */
  "evac:0:0": [
    "Drill opens mid-task — smoke begins rising from equipment in the drift.",
    "ड्रिल काम के बीच शुरू होती है — गैलरी के उपकरण से धुआँ उठने लगता है।",
    "ᱟᱹᱢᱤ ᱟᱞᱟ ᱨ ᱷᱩᱸ ᱩᱛᱨᱚᱜ ᱮᱛᱚᱦᱚᱵᱼᱟ।",
  ],
  "evac:0:1": [
    "The miner stops work and turns his head toward the hazard source.",
    "खनिक काम रोककर खतरे के स्रोत की ओर देखता है।",
    "ᱟᱹᱢᱤ ᱟᱹ ᱟᱛᱮ ᱵᱟᱹᱲ ᱥᱮᱱ ᱞᱟ।",
  ],
  "evac:0:2": [
    "The hazard is highlight-flashed to confirm detection and mark reaction time.",
    "खतरा चमकाकर दिखाया जाता है — पहचान और प्रतिक्रिया समय के लिए।",
    "ᱵᱟᱹᱲ ᱛᱡ ᱟᱛᱮ ᱞ ᱟᱢᱚᱜᱼᱟ।",
  ],
  "evac:0:3": [
    "Recognizing the hazard quickly is scored as the first checkpoint.",
    "खतरे को जल्दी पहचानना पहला चेकपॉइंट है।",
    "ᱞᱚᱜᱚᱱ ᱞ ᱟᱢ ᱵᱟᱲᱟᱝ ᱟᱹᱢᱤᱭᱟ।",
  ],
  "evac:1:0": [
    "The miner moves directly to the nearest manual call point — nothing else first.",
    "खनिक सीधे सबसे नज़दीकी मैनुअल कॉल पॉइंट पर जाता है — पहले कुछ और नहीं।",
    "ᱥ ᱚᱞ ᱵᱚᱴᱟᱱ ᱥᱮᱱ ᱵᱟᱲᱟᱝ ᱥᱮᱱᱚᱜᱼᱟ।",
  ],
  "evac:1:1": [
    "He grips the lever and pulls it down, breaking the cover.",
    "वह लीवर पकड़कर नीचे खींचता है, कवर टूटता है।",
    "ᱞᱵᱟᱨ ᱥᱟᱵ ᱟᱛᱮ ᱞᱟᱛᱟᱨ ᱚᱰᱚᱜᱼᱟ।",
  ],
  "evac:1:2": [
    "Site-wide alarm triggers: strobes flash in sequence down the tunnel.",
    "पूरी साइट का अलार्म बजता है: सुरंग में स्ट्रोब लाइटें बारी-बारी चमकती हैं।",
    "ᱟᱞᱟᱨᱢ ᱥᱟᱰᱜᱼᱟ, ᱞᱟᱭᱥ ᱡᱹᱞ ᱡᱹᱞ ᱞᱚᱜᱼᱟ।",
  ],
  "evac:1:3": [
    "Alerting the control room must happen before any other response action.",
    "किसी भी कार्रवाई से पहले कंट्रोल रूम को चेताना ज़रूरी है।",
    "ᱚᱱᱥᱨᱚᱞ ᱨᱩᱢ ᱞᱟᱹᱭ ᱵᱟᱲᱟᱝ ᱟᱹᱢᱤᱭᱟ।",
  ],
  "evac:2:0": [
    "A quick 180-degree visual sweep of the immediate surroundings.",
    "आसपास की तेज़ 180 डिग्री नज़र झलक।",
    "ᱲ ᱲ ᱞᱚᱜᱚᱱ ᱞ ᱵᱟᱞᱟᱹᱭ ᱵᱮᱞᱮᱞᱮᱭᱟ।",
  ],
  "evac:2:1": [
    "A nearby coworker hasn't reacted — still working, unaware.",
    "पास का साथी अनजान है — अब भी काम कर रहा है।",
    "ᱥᱩᱨ ᱟᱹᱢᱤᱭᱟᱹ ᱵᱟᱝ ᱞ ᱟᱠᱟᱱᱟᱭᱟ।",
  ],
  "evac:2:2": [
    "The miner closes the distance, waves and points to the hazard and escape route.",
    "खनिक पास जाकर हाथ हिलाकर खतरा और निकास मार्ग दिखाता है।",
    "ᱥᱩᱨ ᱥᱱ ᱟᱛᱮ ᱥ ᱵᱟᱹᱲ ᱟᱨ ᱥᱹᱨᱤ ᱞᱟᱹᱭ ᱵᱮᱡᱟᱣ ᱢᱮ।",
  ],
  "evac:2:3": [
    "The coworker switches from idle to alert and follows — no lingering allowed.",
    "साथी सतर्क होकर साथ चलता है — देरी बिल्कुल नहीं।",
    "ᱩᱱ ᱟᱹ ᱟᱛᱮ ᱥᱭᱟᱜᱼᱟ, ᱞᱟᱹᱵᱟᱝ ᱟᱹᱢᱤ ᱢᱮ।",
  ],
  "evac:3:0": [
    "Decision point: fight the fire, or flee to the exit?",
    "निर्णय की घड़ी: आग बुझाएँ या निकास की ओर भागें?",
    "ᱥ ᱵᱩ ᱵᱟᱝᱵᱟ ᱥᱹᱨᱤ ᱥᱫ ᱟᱹᱪᱩᱨ ᱵᱟᱝ ᱵᱟᱝ?",
  ],
  "evac:3:1": [
    "If the fire is small and contained AND the exit path behind stays clear — fight.",
    "आग छोटी-नियंत्रित हो और पीछे का रास्ता खुला हो — तभी बुझाएँ।",
    "ᱥ ᱷᱩ ᱵᱷᱩᱞᱟᱹ ᱷᱟᱱ ᱵᱩ ᱟᱲ।",
  ],
  "evac:3:2": [
    "If it is large, spreading, or blocking the escapeway — turn away immediately.",
    "बड़ी, फैलती या रास्ता रोकती हो — तुरंत मुड़ जाएँ।",
    "ᱵᱟᱨ ᱟᱥᱱ ᱷᱟᱱ ᱞᱚᱜᱚᱱ ᱹᱪᱩᱨ ᱵᱟᱝ ᱵᱷᱟᱝ।",
  ],
  "evac:3:3": [
    "Fleeing is the default correct choice; firefighting must be justified.",
    "भागना ही सही पहला विकल्प है; आग लड़ना सिर्फ़ विशेष स्थिति में।",
    "ᱥᱹᱨᱤ ᱥᱫ ᱹᱪᱩᱨ ᱵᱟᱪᱚᱱᱭᱟ।",
  ],
  "evac:4:0": [
    "A brisk, purposeful walk — never a run, to avoid trips and falls.",
    "तेज़ लेकिन नियंत्रित चाल — कभी दौड़ें नहीं, ठोकर और गिरने से बचें।",
    "ᱟᱹ ᱥᱫ ᱥᱫ ᱭᱟ ᱵᱟᱝ ᱮᱨᱡ ᱵᱟᱝ ᱵᱷᱟᱝ।",
  ],
  "evac:4:1": [
    "Follow the glowing AR path markers along the floor toward the escapeway.",
    "फ़र्श पर चमकते AR मार्ग चिह्नों को फ़ॉलो करते हुए निकास की ओर जाएँ।",
    "ᱚᱥ ᱥᱭᱟᱜ ᱞᱟᱭᱥ ᱠᱤᱱᱷᱟᱹ ᱟᱞᱟᱭᱵᱟᱹ ᱥᱱ ᱵᱟᱝ ᱵᱟᱝ।",
  ],
  "evac:4:2": [
    "Check waypoint markers at each junction before committing.",
    "हर मोड़ पर रास्ते के चिह्न देखकर ही आगे बढ़ें।",
    "ᱚᱥᱥᱚ ᱵᱮᱜ ᱥᱞ ᱵᱟᱝ ᱵᱟᱝ ᱠᱛ ᱥᱱ ᱵᱟᱝ ᱵᱟᱝ।",
  ],
  "evac:4:3": [
    "If smoke blocks the route, the overlay reroutes to the alternate escapeway.",
    "धुआँ रास्ता रोके तो दिशा दूसरे निकास की ओर बदल जाती है।",
    "ᱩᱸ ᱵᱚᱸ ᱷᱟᱱ ᱚᱥᱟᱨ ᱥᱹᱨᱤ ᱥᱫ ᱥᱱ ᱵᱟᱝ ᱵᱟᱝ।",
  ],
  "evac:5:0": [
    "At the junction: lift cage on one side, ladderway on the other.",
    "मोड़ पर: एक ओर लिफ़्ट केज, दूसरी ओर सीढ़ी मार्ग।",
    "ᱵᱟᱨ ᱥᱫ ᱞᱥᱥ, ᱵᱟᱨ ᱥᱫ ᱥᱥᱤᱭᱟ।",
  ],
  "evac:5:1": [
    "The miner reaches for the lift call button — then pulls back mid-reach.",
    "खनिक लिफ़्ट का कॉल बटन दबाने ही वाला होता है — फिर बीच में रोक लेता है।",
    "ᱞᱥᱥ ᱚᱞ ᱵᱚᱥᱟᱱ ᱥᱞᱟ, ᱥᱟᱭ ᱵᱟᱝ ᱟᱹᱢᱤ ᱵᱟᱝ ᱵᱟᱝ।",
  ],
  "evac:5:2": [
    "A flashing DO-NOT-USE cross marks the lift: it can trap occupants or lose power.",
    "लिफ़्ट पर चमकता न-इस्तेमाल-करें चिह्न: फँस सकता है या बिजली जा सकती है।",
    "ᱞᱥᱥ ᱵᱟᱝ ᱟᱹᱵᱭ ᱷᱟᱱ ᱵᱹᱲᱭᱟ।",
  ],
  "evac:5:3": [
    "He redirects to the ladderway and descends at a steady pace, hand on the rail.",
    "वह सीढ़ी मार्ग की ओर जाकर रेलिंग पकड़े संतुलित गति से उतरता है।",
    "ᱥᱥ ᱥᱫ ᱟᱹᱪᱩᱨ ᱟᱛᱮ ᱥᱫ ᱵᱭᱟᱜᱼᱟ।",
  ],
  "evac:6:0": [
    "A personal bag is left on a bench beside the drift — highlighted briefly.",
    "निजी बैग गैलरी किनारे बेंच पर छूटा है — क्षण भर चमकता है।",
    "ᱡ ᱵᱮᱜ ᱵᱱᱠ ᱪ ᱹᱟᱱᱟ।",
  ],
  "evac:6:1": [
    "The miner's head turns toward it — one beat of hesitation.",
    "खनिक का ध्यान उसकी ओर जाता है — क्षण भर हिचकिचाहट।",
    "ᱧᱞᱟᱹᱚᱥ ᱟᱟ, ᱵᱟᱝ ᱵᱟᱝ ᱟᱹᱵᱟᱭᱭᱟ।",
  ],
  "evac:6:2": [
    "He keeps walking: personal items are never worth the delay.",
    "वह चलता रहता है: निजी सामान के लिए देरी कभी नहीं।",
    "ᱹᱟᱱᱟ ᱹᱟᱪᱩᱨᱭᱭᱟ, ᱵᱟᱝ ᱟᱝ ᱟᱹᱵᱟᱭᱭᱟ।",
  ],
  "evac:6:3": [
    "Any detour here scores a time penalty against the evacuation.",
    "यहाँ कोई भी टेढ़ा रास्ता समय की सज़ा देता है।",
    "ᱵᱭ ᱟᱹ ᱵᱟᱝ ᱟᱹᱵᱟᱭᱟᱭᱭᱟ।",
  ],
  "evac:7:0": [
    "Clear of the hazard zone, he continues to the flagged muster point.",
    "खतरे से दूर, वह चिह्नित मस्टर पॉइंट की ओर बढ़ता है।",
    "ᱵᱟᱹᱲ ᱵᱟᱝ ᱟ ᱥᱫ ᱵᱮᱡ ᱵᱟᱝ ᱵᱟᱝᱭᱟ।",
  ],
  "evac:7:1": [
    "ASSEMBLY POINT B: marked post with sign and painted ground marking.",
    "असेंबली पॉइंट B: चिह्न वाला खंभा और ज़मीन पर चित्रित निशान।",
    "ᱥᱦᱵᱞ ᱳᱥ ᱵᱟᱝᱵᱟᱭᱟ।",
  ],
  "evac:7:2": [
    "Other miners converge from different escape routes into a loose group.",
    "अन्य खनिक विभिन्न निकास मार्गों से एक समूह में इकट्ठा होते हैं।",
    "ᱵᱟᱨ ᱟᱹᱵᱟᱭ ᱵᱟᱨ ᱥᱹᱨᱤ ᱠᱚᱱ ᱦᱜ ᱠᱚᱱᱟᱜᱟ।",
  ],
  "evac:7:3": [
    "Stopping anywhere other than the assigned muster point is scored as a miss.",
    "तय मस्टर पॉइंट के अलावा कहीं रुकना गलती मानी जाती है।",
    "ᱵᱮᱡ ᱥᱞ ᱵᱟᱝ ᱟᱝ ᱟᱹᱵᱟᱭᱟᱭᱭᱟ।",
  ],
  "evac:8:0": [
    "Final beat: he reports to the supervisor with the checklist at the muster post.",
    "अंतिम कदम: मस्टर पॉइंट पर सुपरवाइज़र को चेकलिस्ट से रिपोर्ट करता है।",
    "ᱥᱮᱞ ᱵᱮᱡ ᱥᱞᱭᱭᱟ।",
  ],
  "evac:8:1": [
    "A raised-hand gesture registers his presence on the roll call.",
    "उठाए हाथ के इशारे से वह रोल कॉल में दर्ज होता है।",
    "ᱥ ᱵᱟᱹ ᱟᱹᱵᱟᱭᱟᱭᱟᱭᱭᱟ।",
  ],
  "evac:8:2": [
    "The kiosk marks a green check with his name and employee ID.",
    "कियोस्क पर उसके नाम और आईडी के साथ हरा चिह्न लगता है।",
    "ᱧᱩᱩᱵ ᱵᱫ ᱵᱮᱡ ᱥᱞᱭᱭᱟ।",
  ],
  "evac:8:3": [
    "Check-in completes the evacuation loop — never leave without registering.",
    "चेक-इन से निकासी पूरी होती है — दर्ज किए बिना कभी न जाएँ।",
    "ᱟᱹᱚᱥ ᱵ ᱟ ᱩᱟ ᱵᱟᱝ ᱟᱹᱵᱟᱭᱟᱭᱭᱟ।",
  ],
};

/** language index into the [en, hi, sat] tuple */
const LANG_IDX: Record<Language, 0 | 1 | 2> = { en: 0, hi: 1, sat: 2 };

/** look up a module step line; falls back to English when missing */
export function moduleLine(lang: Language, id: string): string {
  const tri = L[id];
  if (!tri) return "";
  return tri[LANG_IDX[lang]] || tri[0];
}
