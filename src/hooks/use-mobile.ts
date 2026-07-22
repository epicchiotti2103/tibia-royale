import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1180 // Covers large phones in landscape and tablets

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkIsMobile = () => {
      const isTouch = (typeof window !== 'undefined' && 
        (window.matchMedia("(pointer: coarse)").matches || 
         ('ontouchstart' in window) || 
         (navigator.maxTouchPoints > 0)));
         
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      const isLandscapeMobile = window.innerWidth < TABLET_BREAKPOINT && window.innerHeight < 600;

      setIsMobile(isSmallScreen || (isTouch && window.innerWidth < TABLET_BREAKPOINT) || isLandscapeMobile);
    }

    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT}px)`)
    const orientationMql = window.matchMedia("(orientation: landscape)")
    
    mql.addEventListener("change", checkIsMobile)
    orientationMql.addEventListener("change", checkIsMobile)
    
    checkIsMobile()
    
    return () => {
      mql.removeEventListener("change", checkIsMobile)
      orientationMql.removeEventListener("change", checkIsMobile)
    }
  }, [])

  return !!isMobile
}
