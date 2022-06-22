import { useEffect, useState } from 'react';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 100,
    height: 200,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const useIsMobile = () => {
  const { width } = useWindowSize();

  return width < 768;
};

const useIsSmallScreen = () => {
  const { width } = useWindowSize();

  return width < 1030;
};

const useIsSemiSmallScreen = () => {
  const { width } = useWindowSize();

  return width < 1180;
};

export { useIsMobile, useIsSmallScreen, useIsSemiSmallScreen };
