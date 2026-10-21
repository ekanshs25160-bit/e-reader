import Link from 'next/link';

export const metadata = { title: 'Flyleaf' };

export default function Page() {
  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <main className="w-full bg-background flex-col relative pb-28 md:pb-10">
        <header className="md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-sm dark:shadow-none flex justify-between items-center w-full px-gutter py-space-sm border-b border-outline-variant/30">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-outline-variant/40 bg-surface-container-high flex items-center justify-center">
              <img className="w-full h-full object-cover" data-alt="A dignified close-up portrait of a thoughtful reader in soft afternoon sunlight inside a classical wood-paneled library, fine art photography, warm cream and deep indigo tones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa2b_KB0Su7rUQgMiJyBfvSK82YsnkwTxuyKmNZkBGDJLzpcrZ3GZhnuvjZXBPoI9CQly_7XbiNQqsODYWNmECDYE5zOV0443CZI9yawG6fLDxAiGrjct8SNzCxp-er031SZl--_tbtPqzVXiKNeM_ORZ2hj2I2VRLog2nK7ztHGtAaE2VJnAruY0XdTDOxmiHQa5sCuqZO2Ew1sYYvOPr_KCr6UchtqD2Y4qIMyX8QYJx4-nTDxs8" />
            </div>
            <span className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-medium tracking-tight">
              Flyleaf
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/library" aria-label="Search" className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </Link>
          </div>
        </header>
        <div className="px-gutter md:px-8 pt-5 flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          <section className="lg:col-span-2 flex flex-col space-y-3.5">
            <div className="flex flex-col space-y-1">
              <h1 className="font-headline-lg text-headline-lg text-primary font-normal tracking-tight">
                Your reading
              </h1>
              <p className="font-caption text-caption text-on-surface-variant italic leading-relaxed">
                Measured on this device, kept on this device. Nothing here has ever left it.
              </p>
            </div>
            <Link className="group flex items-center justify-between px-3.5 py-2.5 bg-surface-container-lowest/80 backdrop-blur-sm border border-black/[0.08] dark:border-white/10 hover:border-black/[0.16] rounded-full shadow-[0_1px_3px_rgba(44,64,88,0.03)] active:scale-[0.98] transition-all duration-150" href="/reader/piranesi">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="material-symbols-outlined text-primary text-[18px] group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-label-md text-label-md text-primary tracking-wide">
                    BACK TO
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface italic truncate">
                    Piranesi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pl-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>
                  menu_book
                </span>
              </div>
            </Link>
          </section>
          <section className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                TIME READ
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  87
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                    h
                  </span>
                   58
                  <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                    m
                  </span>
                </span>
              </div>
            </div>
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                  DAYS RUNNING
                </span>
                <span className="material-symbols-outlined text-secondary text-[17px]" style={{fontVariationSettings: "'FILL' 1"}}>
                  local_fire_department
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  6
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5 italic">
                  days streak
                </span>
              </div>
            </div>
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                FINISHED
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  4
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                  volumes
                </span>
              </div>
            </div>
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
              <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                HIGHLIGHTS
              </span>
              <div className="mt-2.5 flex items-baseline">
                <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                  51
                </span>
                <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                  passages
                </span>
              </div>
            </div>
          </section>
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3.5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                This week
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                1h 2m since Monday · 21m a day
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 pt-1">
              <div className="flex flex-col items-center space-y-1.5">
                <span className="font-label-sm text-label-sm text-on-surface">
                  M
                </span>
                <div className="w-full aspect-[2/3] rounded-md overflow-hidden ring-1 ring-black/15 shadow-sm relative group bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Cover illustration of Piranesi novel featuring classical hall flooded by turquoise ocean tides and ancient marble statues, deep moody teal lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNl9RHp_P_wjhuLyd6ECPoVjHQx_OMoQyDBH05jSextB8aNugHisbeI4hr5nhDPgMx5-nXAnoTJ8TzmvgXfFLfU4g664k5CJGGw51qkNHXa87YUKa6Jf2BlhgLC2rkdkDzz9omU4uuqlE2QztEV-Lwh54nmQH2bvLuitXatQKoTVtj5sGXkd1YRGpCsN3qqgK6X70PXkEqjLqnKpTzjD0ALAdDInCCHICTsx5A6cmgtebfVNnM3OLl" />
                </div>
                <span className="px-1.5 py-0.5 bg-[#EEECE6] text-on-surface rounded text-[10px] font-label-sm font-semibold">
                  24m
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5">
                <span className="font-label-sm text-label-sm text-on-surface">
                  T
                </span>
                <div className="w-full aspect-[2/3] rounded-md overflow-hidden ring-1 ring-black/15 shadow-sm relative group bg-surface-container">
                  <img className="w-full h-full object-cover" data-alt="Cover artwork depicting a vast sunken palazzo with classical arches and rising sea water under muted cathedral lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCe-05Porlpg7os3ELtOh4KN5cyk3J3-ANkXc7e23U6UB4zLZbVj48iIoKWrEab1OYb-p1V0tuvFWfIM5Yxdv-6BPRzvFYkE5zgd4_aoEZsErKnkyTASWJeQ-w1ZljIfG2kIV55N5_dmijGLNLwMMZgXZN5kIMiRqrVSFO2KaqPq3ps-mAuhh1T3DlgZf5fh0qkiA0qAUWfMEPgsPYsO4Tu0mFieSCU3BR-fNXqG-oyrSwxqSO8wHAo" />
                </div>
                <span className="px-1.5 py-0.5 bg-[#EEECE6] text-on-surface rounded text-[10px] font-label-sm font-semibold">
                  18m
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5">
                <span className="font-label-sm text-label-sm text-on-surface">
                  W
                </span>
                <div className="w-full aspect-[2/3] rounded-md overflow-hidden ring-1 ring-black/15 shadow-sm relative group bg-surface-container ring-secondary/50">
                  <img className="w-full h-full object-cover" data-alt="Book jacket showing miniature classical ruins surrounded by mist and gentle ocean swells inside high neoclassical ceilings." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMOHNtWKtnnsEdd-P4C1LRZ-9uRhrca-tKUF7VIZo5V261ioaeiM8MsW0hwaQUFuJxbj8ieE-uhcG85v-QDuGaOuL5Vrhu4tYD_szeoesGGW_rCzo9skPry9BGXZB61f-JSXRBfxh7myLWFnfE13Nnlyg9BPhPg2KIeuIjnMagXYdUkdTLAp2iaruEjv_yWO7OiuNQ4UGZoTNYh-rZ2GdFWzG6Wc1T1fGrk9ftKQ5SyABaX-YcOZp4" />
                </div>
                <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed-variant rounded text-[10px] font-label-sm font-bold">
                  20m
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5 opacity-60">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  T
                </span>
                <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                </div>
                <span className="text-[10px] font-caption text-on-surface-variant">
                  —
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5 opacity-60">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  F
                </span>
                <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                </div>
                <span className="text-[10px] font-caption text-on-surface-variant">
                  —
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5 opacity-60">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  S
                </span>
                <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                </div>
                <span className="text-[10px] font-caption text-on-surface-variant">
                  —
                </span>
              </div>
              <div className="flex flex-col items-center space-y-1.5 opacity-60">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  S
                </span>
                <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                </div>
                <span className="text-[10px] font-caption text-on-surface-variant">
                  —
                </span>
              </div>
            </div>
          </section>
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3">
            <div className="flex flex-col space-y-0.5">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                The last six months
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                144 days with a book · longest run 52 days
              </span>
            </div>
            <div className="overflow-x-auto pt-2 pb-1">
              <div className="min-w-[310px] flex flex-col space-y-1.5">
                <div className="flex text-[10px] font-caption text-on-surface-variant pl-4 justify-between pr-1">
                  <span>
                    Oct
                  </span>
                  <span>
                    Nov
                  </span>
                  <span>
                    Dec
                  </span>
                  <span>
                    Jan
                  </span>
                  <span>
                    Feb
                  </span>
                  <span>
                    Mar
                  </span>
                </div>
                <div className="flex gap-1.5 items-start">
                  <div className="flex flex-col justify-between text-[9px] font-caption text-on-surface-variant h-[78px] py-0.5 select-none">
                    <span>
                      M
                    </span>
                    <span>
                      W
                    </span>
                    <span>
                      F
                    </span>
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 gap-[3px] flex-1">
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#938E86]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#4E4B46]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1F1E1C]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6] border border-dashed border-[#C5C0B7]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-[#EFECE6]"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] font-caption text-on-surface-variant">
              <span>
                Less
              </span>
              <span className="w-2 h-2 rounded-[2px] bg-[#EFECE6]"></span>
              <span className="w-2 h-2 rounded-[2px] bg-[#C5C0B7]"></span>
              <span className="w-2 h-2 rounded-[2px] bg-[#938E86]"></span>
              <span className="w-2 h-2 rounded-[2px] bg-[#4E4B46]"></span>
              <span className="w-2 h-2 rounded-[2px] bg-[#1F1E1C]"></span>
              <span>
                More
              </span>
            </div>
          </section>
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-4">
            <div className="flex flex-col space-y-0.5">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                Where the time went
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                Ranked by total session duration
              </span>
            </div>
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="truncate pr-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                      Things Fall Apart
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                      · Chinua Achebe
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-medium shrink-0">
                    24h 15m
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F1E1C] rounded-full" style={{width: "100%"}}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="truncate pr-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                      Klara and the Sun
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                      · Kazuo Ishiguro
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-medium shrink-0">
                    19h 40m
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F1E1C] rounded-full" style={{width: "81%"}}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="truncate pr-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                      Half of a Yellow Sun
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                      · Chimamanda Ngozi Adichie
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-medium shrink-0">
                    18h 22m
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F1E1C] rounded-full" style={{width: "76%"}}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="truncate pr-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                      Stay With Me
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                      · Ayọ̀bámi Adébáyọ̀
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-medium shrink-0">
                    14h 05m
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F1E1C] rounded-full" style={{width: "58%"}}></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <div className="truncate pr-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                      The Fishermen
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                      · Chigozie Obioma
                    </span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-medium shrink-0">
                    11h 36m
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1F1E1C] rounded-full" style={{width: "48%"}}></div>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
              Pace
            </h2>
            <div className="divide-y divide-black/[0.06]">
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  LAST 30 DAYS
                </span>
                <span className="font-body-reading text-body-reading text-on-surface font-medium">
                  12h 8m 
                  <span className="text-on-surface-variant text-sm font-normal">
                    over 21 days
                  </span>
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  TYPICAL DAY
                </span>
                <span className="font-body-reading text-body-reading text-on-surface font-medium">
                  37m
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  BEST DAY
                </span>
                <span className="font-body-reading text-body-reading text-on-surface font-medium">
                  1h 4m 
                  <span className="text-on-surface-variant text-sm font-normal">
                    on March 6
                  </span>
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  LONGEST RUN
                </span>
                <span className="font-body-reading text-body-reading text-on-surface font-medium">
                  52 days
                </span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  PAGES TURNED
                </span>
                <span className="font-body-reading text-body-reading text-on-surface font-medium">
                  7,918
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
