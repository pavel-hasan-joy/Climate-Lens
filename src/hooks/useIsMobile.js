import { useEffect, useState } from 'react';

const QUERY = '(max-width: 720px)';

export default function useIsMobile() {
  const [mobile, setMobile] = useState(() => matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = matchMedia(QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return mobile;
}
