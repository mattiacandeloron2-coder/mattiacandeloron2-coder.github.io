/**
 * Central editable configuration.
 *
 * - silhouette.image: PNG/JPG of the charcoal figure
 * - silhouette.*: particle count, smoke, depth, mouse
 * - sections: biography texts and spatial placement
 * - projects: selected works (full-bleed photos, titles)
 */
export const colors = {
  paper: '#F7F7F4',
  paperAlt: '#FAFAF8',
  ink: '#111111',
  muted: '#626262',
  line: '#E8E8E4',
  inkSoft: '#2A2A2A',
  blueGrey: '#829DA7',
  green: '#8FA596',
  blueGreyLight: '#B8CDD2',
  greenLight: '#C7D2C7',
  greenDark: '#465850',
  carmine: '#B11226',
}

export const config = {
  typography: {
    family: '"Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },

  silhouette: {
    image: '/assets/silhouette.png',
    particleDensity: 1,
    countDesktop: 30000,
    countMobile: 11000,
    sampleMax: 520,
    alphaThreshold: 14,
    luminanceThreshold: 16,
    particleSize: 1.85,
    particleSizeMax: 2.4,
    edgeDissolve: 0.06,
    smokeStrength: 0.18,
    coreNoise: 0.0007,
    edgeNoise: 0.016,
    noiseSpeed: 0.06,
    depth: 0.032,
    edgeDepth: 0.07,
    mouseInteraction: true,
    mouseRotateY: 6,
    mouseRotateX: 3,
    disturbRadius: 0.42,
    disturbStrength: 0.035,
    returnStrength: 0.08,
    parallax: 0.55,
    opacity: 1,
    chromaBoost: 1.35,
    carmine: [0.831, 0.125, 0.22],
    chromaThreshold: 0.09,
    carmineRadius: 10,
    position: { x: 0.22, y: -0.06, z: 0 },
    height: 1.58,
  },

  figure: {
    model: '/models/model.glb',
    height: 0.92,
    heightMobile: 0.58,
    color: '#3D3D3A',
    roughness: 0.78,
    metalness: 0.02,
    yawOffset: 0,
    position: { x: 0, y: 0, z: 0 },
    positionMobile: { x: 0, y: -0.28, z: 0 },
    particles: {
      countDesktop: 18000,
      countMobile: 8000,
      particleSize: 1.62,
      particleSizeMax: 2.28,
      smokeStrength: 0.26,
      coreNoise: 0.0038,
      edgeNoise: 0.02,
      noiseSpeed: 0.07,
      dustStrength: 0.012,
      dustSpeed: 0.42,
      scrollCalm: 0.4,
      cloudDepth: 0.03,
      edgeDissolve: 0.05,
      disturbRadius: 0.5,
      disturbStrength: 0.058,
      returnStrength: 0.08,
      mouseInteraction: true,
      handRadius: 0.18,
      bladeWidth: 0.026,
      strokeLength: 0.028,
      soffioAmp: 0,
      taglioAmp: 0.34,
      gustAmp: 0.42,
      coastSeconds: 0.5,
      coastPeak: 1.18,
      returnSeconds: 3.4,
      body: '#111111',
      bodySoft: '#2A2A2A',
      chair: '#5E8F9C',
      chairSoft: '#8FB4BE',
      drill: '#B11226',
      drillDeep: '#8A0E1E',
    },
  },

  camera: {
    fov: 32,
    near: 0.1,
    far: 60,
    lerp: 0.075,
    distance: 3.7,
    distanceMobile: 3.95,
    lookAt: { x: 0, y: 0.02, z: 0 },
    lookAtMobile: { x: 0, y: -0.22, z: 0 },
    orbitStart: 45, // 3/4 at rest, drill on the left
    orbitTurns: 1,
    orbitHeight: 0.08,
    introEnd: 1,
  },

  scroll: {
    distance: 5800,
    lerp: 0.068,
    maxDelta: 72,
    pixelScale: 1,
    lineScale: 16,
    pageScale: 0.9,
    touchScale: 1.35,
    energyDecay: 0.04,
    introEnd: 1,
  },

  timings: {
    hero: { start: 0, peak: 0, end: 0.055 },
    role: { start: 0, peak: 0, end: 0.57 },
    outro: { start: 0.89, peak: 0.97, end: 1 },
  },

  sections: [
    {
      id: 'who',
      index: '01',
      title: 'WHO AM I?',
      body: 'A 23 years old aspiring product designer, from Tortoreto Lido (TE, Italy), driven by the ambition to contribute to the material transition needed to address increasingly urgent environmental challenges. I dream a future in which design is accessible to everyone where beauty and function coexist, inspired by nature and its processes.',
      focus: 0.16,
      appear: 0.08,
      disappear: 0.27,
      position: { x: -0.78, y: 0.18, z: 0.08 },
    },
    {
      id: 'education',
      index: '02',
      title: 'EDUCATION',
      body: `<div class="section-entry">
        <span class="section-place">Università degli studi di Camerino</span>
        <span class="section-credential">Bac. Deg. in Industrial and Environmental Design</span>
        <span class="section-years">(2022–2026)</span>
      </div>
      <div class="section-entry">
        <span class="section-place">LVMH</span>
        <span class="section-credential">Inside LVMH Certificate</span>
        <span class="section-years">(Sep. 2023 – Nov. 2023)</span>
      </div>
      <div class="section-entry">
        <span class="section-place">I.T.T. Crocetti Cerulli, Giulianova (TE)</span>
        <span class="section-credential">Technical Diploma in Computer Technology</span>
        <span class="section-years">(2016–2021)</span>
      </div>`,
      focus: 0.3,
      appear: 0.22,
      disappear: 0.41,
      position: { x: 0.82, y: 0.52, z: -0.06 },
    },
    {
      id: 'languages',
      index: '03',
      title: 'LANGUAGES',
      body: `<div class="section-entry">
        <span class="section-place">Italian</span>
        <span class="section-credential">Native</span>
      </div>
      <div class="section-entry">
        <span class="section-place">English</span>
        <span class="section-credential">Fluent B2 TOEFL cert.</span>
      </div>`,
      focus: 0.43,
      appear: 0.35,
      disappear: 0.54,
      position: { x: -0.74, y: -0.38, z: 0.12 },
    },
    {
      id: 'softwares',
      index: '04',
      title: 'SOFTWARES',
      body: `<div class="section-catalog">
        <div class="section-catalog-row">
          <span class="section-catalog-label">3D</span>
          <span class="section-catalog-items">Rhinoceros 3D, Blender</span>
        </div>
        <div class="section-catalog-row">
          <span class="section-catalog-label">Graphic</span>
          <span class="section-catalog-items">InDesign, Illustrator, Photoshop, Figma</span>
        </div>
        <div class="section-catalog-row">
          <span class="section-catalog-label">Motion</span>
          <span class="section-catalog-items">DaVinci Resolve, Premiere Pro, Artivive</span>
        </div>
        <div class="section-catalog-row">
          <span class="section-catalog-label">AI</span>
          <span class="section-catalog-items">Vizcom, Cursor, OpenCode</span>
        </div>
      </div>`,
      focus: 0.57,
      appear: 0.49,
      disappear: 0.68,
      position: { x: 0.76, y: 0.42, z: 0.04 },
    },
    {
      id: 'hard-skills',
      index: '05',
      title: 'HARD SKILLS',
      body: `<div class="section-list">
        <span class="section-place">Product design &amp; development</span>
        <span class="section-place">Prototyping</span>
        <span class="section-place">Product communication</span>
        <span class="section-place">3D modelling and printing</span>
        <span class="section-place">Rendering</span>
        <span class="section-place">Graphic design</span>
        <span class="section-place">Creative coding</span>
      </div>`,
      focus: 0.7,
      appear: 0.62,
      disappear: 0.81,
      position: { x: -0.8, y: 0.14, z: -0.08 },
    },
    {
      id: 'soft-skills',
      index: '06',
      title: 'SOFT SKILLS',
      body: `<div class="section-list">
        <span class="section-place">Problem solving</span>
        <span class="section-place">Critical thinking</span>
        <span class="section-place">User-centred design</span>
        <span class="section-place">Life Cycle Assessment (LCA) awareness</span>
      </div>`,
      focus: 0.84,
      appear: 0.76,
      disappear: 0.93,
      position: { x: 0.78, y: -0.1, z: 0.16 },
    },
    {
      id: 'contact',
      index: '07',
      title: 'CONTACT',
      body: `<div class="section-list">
        <a class="section-contact" href="mailto:mattiacandeloro.design@gmail.com">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.6"/><path d="m4 7 8 6 8-6"/></svg>
          <span>mattiacandeloro.design@gmail.com</span>
        </a>
        <a class="section-contact" href="tel:+393483198226">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span>+39 3483198226</span>
        </a>
      </div>`,
      focus: 0.97,
      appear: 0.89,
      disappear: 1.2,
      position: { x: -0.72, y: -0.48, z: 0.08 },
    },
  ],

  projects: [
    {
      id: '01',
      title: 'Firmamento',
      meta: 'Solo project',
      lines: ['Solo project', '4 months - 2026'],
      image: '/progetti/Firmamento/copertina.jpg',
      indexImage: '/progetti/Firmamento/indice.jpg',
      frames: [
        { role: 'sky', title: 'Firmamento' },
        { src: '/progetti/Firmamento/apertura.jpg', role: 'cover' },
        {
          src: '/progetti/Firmamento/esploso.png',
          role: 'object',
          copy: {
            label: 'The context',
            body: 'Following the COVID-19 pandemic, <strong>anxiety disorders rose by approximately 25% worldwide</strong>, highlighting the significant impact that crowded and overstimulating environments can have on psychological well-being.\n\nFirmamento was conceived to make underground transit spaces more humane and less stressful, through an intervention informed by research into <strong>aromatherapy, lighting, and soft, non-threatening forms</strong>, with the aim of reducing sensory overstimulation and fostering a greater sense of calm, safety, and well-being.',
          },
        },
        {
          src: '/progetti/Firmamento/ChatGPT Image 4 set 2026, 01_43_35.png',
          role: 'zoom',
          blocks: [
            {
              label: 'The role of the light.',
              tone: 'rose',
              body: 'Scientific research highlights controlled breathing and the visualization of a familiar, safe place as effective ways to reduce anxiety and PTSD symptoms. Inspired by this, I designed the lights to <strong>evoke a starry sky</strong>, using gentle pulses to support <strong>focus and relaxation</strong>.',
            },
            {
              label: 'How?',
              tone: 'ask',
              body: 'Firmamento combines an LED strip illuminating the wall and ceiling with randomly arranged LEDs that evoke a starry sky. Their soft, programmed fluctuations contrast with the harsh lighting of underground stations and help <strong>reduce sensory tension</strong>.',
            },
          ],
        },
        {
          src: '/progetti/Firmamento/closeup filtri.png',
          role: 'filters',
          detail: '/progetti/Firmamento/ChatGPT Image 4 set 2026, 01_51_58.png',
          copy: {
            body: 'The perception of clean space has to keep pace with the real cleaning of it.\n\nThat\'s why i designed a <strong>full filters system</strong> to clean the air of the subway and added <strong>tridimensional curves</strong> to the front of the object, so people\'s gonna get that the air pushed by the train is set to be cleaned by Firmamento, helping people to relax and stop thinking about what they\'re breathing.',
          },
        },
        {
          src: '/progetti/Firmamento/atomizzatore.png',
          role: 'scent',
          blocks: [
            {
              label: 'The Parfume as a vehicle of relax and informations.',
              tone: 'rose',
              body: 'I decided to choose a cold atomizer to make sure that the little particles of scent <strong>don\'t contribute to increase the humidity level</strong>, that\'s the result.\n\nThe smell represent an <strong>identity element</strong> of the station and the place, using aromatherapy friendly smells it can help the user to relax in the metro station and to remember the specific station. I also designed an ipothetical <strong>parfume palette</strong> based on Rome and divided by day/night and the four seasons.',
            },
            {
              label: 'Proposed olfactory palette',
              tone: 'ask',
              day: [
                'Wisteria + Lemon Leaf + Mint',
                'Lemon + Basil + Ozone',
                'Fig Leaf + Mandarin + Grass',
                'Grapefruit + Cypress + Ozone',
              ],
              night: [
                'Lavender + White Tea + Orange',
                'Maritime Pine + Cedar',
                'Black Tea + Fig Wood + Chestnut',
                'White Tea + Birch + Clean Linen',
              ],
            },
          ],
        },
        {
          src: '/progetti/Firmamento/scocca_scontornata.png',
          role: 'shell',
          copy: {
            label: 'The shell.',
            body: 'The front <strong>Polycarbonate panel</strong> is derived from a rectangle with rounded corners, then curved on both sides. When positioned near a corner, its shape helps to hide sharp edges and <strong>reduce the perception of threat</strong> associated with them.\n\nThe structure, in Polycarbonate too is supported by a suspension arm, fixed to both the casing and the wall with four screws to ensure stability. The casing also features <strong>internal reinforcements</strong>, allowing the overall thickness of the object to be reduced without compromising structural strength.',
          },
        },
        {
          role: 'phases',
          copy: {
            label: 'How I shaped the object.',
            body: 'I started with the idea of creating <strong>small modular elements</strong> in different colours. As the research developed, I decided to darken the sharper parts of the design to reduce the visual cues that could trigger the amygdala. From there, I explored <strong>different shapes</strong> and lighting solutions, gradually integrating the filtration system as well. The final direction sits somewhere between <strong>fully organic forms</strong> and a more minimal, controlled aesthetic.',
          },
          steps: [
            '/progetti/Firmamento/1.png',
            '/progetti/Firmamento/2.png',
            '/progetti/Firmamento/3.png',
            '/progetti/Firmamento/4.png',
            '/progetti/Firmamento/5.png',
          ],
        },
        {
          role: 'finale',
          shots: [
            {
              src: '/progetti/Firmamento/togli la scritta nel cartello.png',
              place: 'station',
            },
            {
              src: '/progetti/Firmamento/allungata.png',
              place: 'side',
            },
            {
              src: '/progetti/Firmamento/aria.png',
              place: 'air',
            },
          ],
          measures: '/progetti/Firmamento/A3misuredimassimoesportato.png',
        },
      ],
      imageFocus: '50% 28%',
      accent: '#829DA7',
      type: 'shell',
      info: {
        CONTEXT:
          'Following the COVID-19 pandemic, anxiety disorders rose by approximately 25% worldwide, highlighting the significant impact that crowded and overstimulating environments can have on psychological well-being. Firmamento was conceived to make underground transit spaces more humane and less stressful, through an intervention informed by research into aromatherapy, lighting, and soft, non-threatening forms, with the aim of reducing sensory overstimulation and fostering a greater sense of calm, safety, and well-being.',
        RESEARCH: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        CONCEPT: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        DEVELOPMENT: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'FINAL RESULT': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
      },
    },
    {
      id: '02',
      title: 'Salotto audiovisivo',
      indexTitle: 'Salotto Audiovisivo',
      meta: 'Workshop project',
      lines: ['Reverie festival', 'Workshop project', '1 week - 2026'],
      image: '/progetti/Salotto audiovisivo/copertina.jpg',
      indexImage: '/progetti/Salotto audiovisivo/indice.jpg',
      imageFocus: '52% 40%',
      accent: '#8FA596',
      type: 'planes',
      frames: [
        {
          src: '/progetti/Salotto audiovisivo/SnapInsta.to_AQNGUWj_SKTZa4plByCHKizogn0bz2tpVTs9tEdbNXuke7QpP0O0xfht4KmFVTih_76CedvAm_05LbNQF7QT-XS0671atatTELBPqNc.mp4',
          role: 'reel',
          stills: [
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_768638078_18021482135914891_2681188790168449852_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_769154455_18021482126914891_6798764931731541672_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_769907340_18021482222914891_7339667434457036457_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_770962330_18021482036914891_5983403478849992830_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_770962330_18021482225914891_1639185890189142417_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_771541339_18021482288914891_2920276085758972177_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_771652573_18021482192914891_4495289732872229288_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_771814775_18021482228914891_1657409257336669798_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_771823022_18021482261914891_4395659301688650533_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_772888923_18021482153914891_7282867850277606920_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_773450335_18021482105914891_608276364394677164_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_773735562_18021482279914891_6986331638374301298_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_774295197_18021482174914891_13729015342129547_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_774334768_18021482075914891_1741435276721288105_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_775106587_18021482003914891_3025898413311348304_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777150437_18021482117914891_4451808832103145964_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777299016_18021481988914891_1712265925187200162_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777381610_18021803720914891_8237960239586562259_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777381621_18021803864914891_6822865721346512051_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777418210_18021803756914891_5963897548599826916_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_777419034_18021482270914891_8188321573028431914_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_778139449_18021803771914891_3901690817914730462_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_778156708_18021803789914891_6152994574098368154_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_778156711_18021803681914891_5022950421760618694_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_778172649_18021803846914891_2306996417145756723_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_779017593_18021934730914891_5673086472915818099_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_780087746_18021803819914891_3068026208008512046_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_780482128_18021934727914891_1517830359940850777_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_780771447_18021803660914891_5969222787237411660_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_780949586_18021934850914891_2428128541149711548_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_781251171_18021934817914891_8737716863991035329_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_781251173_18021934745914891_5721763552142497270_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_782208284_18021934682914891_138147664722272188_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_782570238_18021934880914891_6170341272937205490_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783126058_18021803855914891_1101630125060788374_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783126058_18021934700914891_5165060816428695167_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783126058_18021934808914891_5250606005523657161_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783240516_18021934883914891_5216374376900616429_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783286245_18021934826914891_2779502366430274147_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783374679_18021934655914891_8965505618374664099_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783374679_18021934691914891_2783392348713115111_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783374679_18021934916914891_6502031695085677421_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783406697_18021934709914891_2166406930052441471_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783424091_18021934865914891_472412666443933088_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_783507384_18021934673914891_1055470743496803119_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_785281308_18022910852914891_2153667052436540734_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_785599827_18022910831914891_421172096020560046_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_787666419_18022910867914891_800263009602162731_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_788102690_18022910822914891_3325269821128260148_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_789424825_18022910792914891_6754058180150996469_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_790993283_18023631110914891_7022981824552389910_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_791096345_18023631017914891_7753856560474885840_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_791143564_18023631071914891_8122013049497430652_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_791334199_18023631044914891_2251095793920290595_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_791659901_18023631176914891_1427674596634939990_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_791959624_18023631041914891_8970390722145572927_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_792069885_18023631026914891_7263289228518857827_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_792206097_18023631065914891_7882646793153384945_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_792764407_18023631185914891_5613835713645986399_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_793090545_18023631095914891_4176274507137119045_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_793244880_18023631083914891_1099397052108704864_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_793867323_18023631068914891_4667453999228862532_n.jpg',
          '/progetti/Salotto audiovisivo/reverie/SnapInsta.to_794139368_18023631167914891_6166065505712184714_n.jpg',
          ],
        },
        {
          src: '/progetti/Salotto audiovisivo/DSCF0133.png',
          role: 'cover',
          focus: 'center 42%',
        },
        {
          role: 'concept',
          src: '/progetti/Salotto audiovisivo/8.png',
          logo: '/progetti/Salotto audiovisivo/MIRA_logo_black_white.png',
          copy: {
            label: 'The concept.',
            tone: 'quiet',
            body: 'Starting from a project by the architect <strong>Michele Benignetti</strong>, founder of the studio Mira, and Andrea Di Febo, I had the opportunity to contribute to the set design and the planning of the entire <strong>Reverie festival space</strong>. The main goal was to create an installation that could use and enhance elements from my local territory, giving them a new value and identity, while keeping the overall cost close to zero.',
          },
        },
        {
          role: 'stage',
          src: '/progetti/Salotto audiovisivo/index.png',
          copy: {
            label: 'The stage',
            tone: 'rose',
            body: 'The proposal features lateral scenic elements conceived as softboxes, built with wooden frames and semi-transparent fabric. PAR LEDs placed behind them create a <strong>soft, gradually shifting glow</strong>, reminiscent of lantern light. Behind the musicians, rectangular video-mapped panels display natural imagery such as the sea, trees, branches and flowers.\n\nThe overall setting creates an <strong>intimate audiovisual environment</strong>, with warm, diffused lighting gently outlining the musicians\' silhouettes. Rather than relying on strobe effects or visual spectacle, the design focuses on a subtle, immersive and evocative atmosphere.',
          },
        },
        {
          role: 'materials',
          label: 'Materials used',
          items: [
            {
              src: '/progetti/Salotto audiovisivo/15.jpg',
              text: 'Main line, knots and swivels. Tubular sections and single-bolt double clamps.',
            },
            {
              src: '/progetti/Salotto audiovisivo/14.png',
              text: 'Wood panels from furnitures.',
              fit: 'contain',
            },
            {
              src: '/progetti/Salotto audiovisivo/13.jpg',
              text: 'Zinc plates for boat hulls.',
            },
          ],
          sketches: [
            { src: '/progetti/Salotto audiovisivo/12.png', place: 'knots' },
            { src: '/progetti/Salotto audiovisivo/11 - Copia.png', place: 'truss' },
          ],
        },
        {
          role: 'parterre',
          src: '/progetti/Salotto audiovisivo/ChatGPT Image 6 set 2026, 18_36_19.png',
          copy: {
            label: 'The parterre',
            tone: 'rose',
            body: 'The bar and merch zone is made from wood, fabric and <strong>reclaimed materials</strong>, integrated with subtle 3000 K LED strips. Their design draws from the <strong>Abruzzo landscape</strong> and traditional trabocchi, combining functionality, simplicity and material character in a recognizable, welcoming form. A green strip along the parterre creates a more intimate area for resting and experiencing the music without becoming detached from the square.\n\nI had to build and adjust the project to the needs and unexpected issues that came up during the process.',
          },
        },
        {
          role: 'samples',
          label: 'Materials used',
          items: [
            {
              src: '/progetti/Salotto audiovisivo/19.jpg',
              name: 'Fabrics',
              detail: 'Re-used and donated by sofa and furnitures companies',
            },
            {
              src: '/progetti/Salotto audiovisivo/20.jpg',
              name: 'Pallets and slats',
              detail: 'Donated from local companies',
            },
            {
              src: '/progetti/Salotto audiovisivo/17.jpg',
              name: 'Strips led',
            },
            {
              src: '/progetti/Salotto audiovisivo/18.jpg',
              name: 'Aluminum uprights',
            },
          ],
        },
        {
          src: '/progetti/Salotto audiovisivo/ChatGPT Image 2 set 2026, 17_31_06.png',
          role: 'still',
          focus: 'center center',
        },
      ],
      info: {
        CONTEXT: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        RESEARCH: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        CONCEPT: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        DEVELOPMENT: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'FINAL RESULT': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
      },
    },
    {
      id: '03',
      title: 'Spiraluma',
      meta: 'Team project',
      lines: ['Team project', '3 months - 2026'],
      image: '/progetti/Spiraluma/copertina.jpg',
      indexImage: '/progetti/Spiraluma/indice.jpg',
      imageFocus: '70% 78%',
      accent: '#465850',
      type: 'tube',
      frames: [
        {
          role: 'hang',
        },
        {
          src: '/progetti/Spiraluma/copertina.jpg',
          role: 'cover',
          focus: '70% 78%',
        },
        {
          role: 'idea',
          model: '/progetti/Spiraluma/lumaca.obj',
          copy: {
            label: 'The Idea',
            tone: 'rose',
            body: 'Spiraluma was created from the need to give new life to <strong>industrial waste</strong> produced by a local company. Every day, tons of air-conditioning tubing are discarded, often while still perfectly intact. Through this project, I explored how their useful life could be extended by taking advantage of their physical properties.\n\nOnce coiled and properly processed, the tubes can be transformed into a <strong>durable outdoor toy</strong> whose shape and movement recall a snail.',
          },
        },
        {
          role: 'process',
          src: '/progetti/Spiraluma/IMG_4995.JPG',
          focus: '68% 48%',
          copy: {
            label: 'A new type of process',
            tone: 'rose',
            body: 'I chose to begin with a <strong>practical design process</strong>, allowing the object to evolve through experimentation during construction. This created a <strong>continuous dialogue between designing and making</strong>, with both developing in parallel and providing a more practical and complete understanding of the object.\n\nThe first step was to create the loop and the snail-shaped structure, which was then secured with screws and washers to keep it stable and safe, while preserving its ability to flex under the user\'s weight and then push back upward, returning to its original shape.',
          },
        },
        {
          role: 'supports',
          shots: [
            { src: '/progetti/Spiraluma/IMG_4986.JPG', focus: '46% 58%' },
            { src: '/progetti/Spiraluma/IMG_4999.JPG', focus: '50% 62%' },
            { src: '/progetti/Spiraluma/IMG_4988.JPG', focus: '42% 48%' },
          ],
          copy: {
            label: 'Custom supports, familiar touchpoints',
            tone: 'rose',
            body: 'After several iterations, I developed <strong>rain-resistant seats</strong> and supports to improve stability, using 3D modelling and additive manufacturing. To keep the design <strong>affordable and replicable</strong>, I added road-bike grip tape, providing both a clear handhold and tactile contrast for the child.',
          },
        },
        {
          role: 'board',
          src: '/progetti/Spiraluma/tavola.png',
        },
      ],
      info: {
        CONTEXT: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        RESEARCH: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        CONCEPT: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        DEVELOPMENT: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'FINAL RESULT': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
      },
    },
    {
      id: '04',
      title: 'Look behind',
      indexTitle: 'Look Behind',
      meta: 'Team project',
      lines: ['Team project', '3 months - 2025'],
      image: '/progetti/Look behind/copertina.jpg',
      indexImage: '/progetti/Look behind/indice.jpg',
      imageFocus: '50% 42%',
      frames: [
        {
          src: '/progetti/Look behind/POV.mp4',
          role: 'film',
        },
        {
          src: '/progetti/Look behind/copertina.jpg',
          role: 'cover',
          focus: '50% 42%',
        },
        {
          role: 'sticker',
          src: '/progetti/Look behind/LOOKBEHIND.png',
          copy: {
            label: 'A way to stand against harm justified in the name of profit.',
            tone: 'ink',
            body: 'In a product-saturated world where ethics are increasingly sacrificed for profit, I wanted to develop a project that raises awareness of the environmental and social consequences behind consumer choices.\n\nThe goal was to create a <strong>complete communication product</strong>, combining physical and digital media to expose the practices hidden behind certain brands, promote more ethical purchasing decisions, and reach the widest possible audience. The project therefore works both as a <strong>tangible product</strong> and as a broader communication system designed to inform, engage, and encourage conscious forms of boycott.',
          },
        },
        {
          role: 'posters',
          shots: [
            {
              id: 'tonno',
              src: '/progetti/Look behind/tonno.jpg',
              label: 'Open the tuna poster',
            },
            {
              id: 'petrolio',
              src: '/progetti/Look behind/petrolio.jpg',
              label: 'Open the fuel poster',
            },
            {
              id: 'ambra',
              src: '/progetti/Look behind/ambra.jpg',
              label: 'Open the ambergris poster',
            },
          ],
          copy: {
            label: 'Stand right in front of the consequences of your choices.',
            tone: 'rose',
            body: 'Unfortunately, guilt is often one of the strongest forces that pushes people to change the way they live. My research therefore led me to what seemed like the most effective approach: making people understand that their own choices, not only those of large corporations, can directly affect the lives of others.\n\nThis led to the decision to use explicit imagery, partially concealed by familiar brand labels, and confront the viewer with a simple question:<br>\'How much does your ... really cost?\'',
          },
        },
        {
          role: 'totem',
          src: '/progetti/Look behind/place the object, without modify it in a place, don\'t modify the images inside and what\'s written.png',
          copy: {
            label: 'The attention problem.',
            tone: 'ink',
            body: 'However, very few people actually stop to look at posters as they walk past them. For this reason, I decided to place the posters inside <strong>specially designed totems</strong>, positioned in contexts where it would be difficult to resist the temptation to discover what was hidden inside—and, ultimately, what lies are hidden behind our own choices.',
          },
        },
        {
          role: 'layer',
          steps: '/progetti/Look behind/Artivive-Instructions-WallSticker_Vertical_3s.png',
          phone: '/progetti/Look behind/8f5f72ad-a074-420d-9029-65e890aeb3cf.png',
          copy: {
            label: 'Physical object, digital layer.',
            tone: 'ink',
            body: 'But the interaction goes on, if the user scans the QR code it will bring him to a <strong>website</strong> designed to show the problem and to give solution to him, if he download the <strong>Artivive app</strong> and scan the poster, he can reveal himself the truth behind the labels.',
          },
        },
      ],
      accent: '#B8CDD2',
      type: 'monolith',
      info: {
        CONTEXT: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        RESEARCH: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        CONCEPT: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        DEVELOPMENT: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'FINAL RESULT': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
      },
    },
    {
      id: '05',
      title: 'Ring monster',
      indexTitle: 'Ring Monsters',
      meta: 'Team project',
      lines: ['Team project', '3 months - 2024'],
      image: '/progetti/Ring monster/copertina.jpg',
      indexImage: '/progetti/Ring monster/indice.jpg',
      imageFocus: '50% 82%',
      frames: [
        { role: 'toy' },
        {
          src: '/progetti/Ring monster/copertina.jpg',
          role: 'cover',
          focus: '50% 82%',
        },
        {
          role: 'product',
          bolts: '/progetti/Ring monster/stecche.png',
          sketches: '/progetti/Ring monster/schizzi.png',
          animal: '/progetti/Ring monster/kungo.png',
          copy: {
            label: 'The product',
            tone: 'ink',
            body: 'Ring-Monster originated as a university project aimed at designing a toy concept for IKEA. I began by researching the target audience, identifying children aged 4–6 and focusing on what I felt was often missing from toys for this age group: the stimulation of <strong>imagination</strong> and the utility of the toys, when the kid grows up, in fact the assembled figures can <strong>also be used as decorative objects</strong>, thanks to their compact size, to remember the good old days.',
          },
        },
        {
          role: 'evolve',
          phases: [
            { src: '/progetti/Ring monster/evolve-1.png', left: '0%', top: '25.152%', width: '11.111%' },
            { src: '/progetti/Ring monster/evolve-2.png', left: '16.039%', top: '35.455%', width: '17.681%' },
            { src: '/progetti/Ring monster/evolve-3.png', left: '38.261%', top: '13.333%', width: '22.705%' },
            { src: '/progetti/Ring monster/evolve-4.png', left: '69.275%', top: '10.303%', width: '28.502%' },
          ],
          copy: {
            label: 'The process',
            tone: 'clay',
            body: 'Inspired by the simplicity of a classic Fisher-Price stacking toy, I reinterpreted its basic concept in a more abstract and open-ended way. The animals gradually became less literal and more modular, allowing children to combine the pieces in countless different ways. Individual components were also designed to take on <strong>different meanings</strong> depending on how the creature was assembled—for example, the same element could become a wing, a fin, or another body part.\n\nThe aim was to create a toy capable of bringing a child’s imagination into the physical world, encouraging them to continuously <strong>invent, transform, and reinterpret their own creatures.</strong>',
          },
        },
      ],
      accent: '#C7D2C7',
      type: 'modules',
      info: {
        CONTEXT: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        RESEARCH: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        CONCEPT: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
        DEVELOPMENT: 'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
        'FINAL RESULT': 'Excepteur sint occaecat cupidatat non proident, sunt in culpa.',
      },
    },
  ],
}

export const isMobileQuery = '(max-width: 1024px), (pointer: coarse) and (max-width: 1180px)'
export const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
