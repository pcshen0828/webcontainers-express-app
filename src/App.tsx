import { useEffect, useRef, useState } from 'react';
import './App.css';
import { WebContainer } from '@webcontainer/api';

function App() {
  const [, setWebContainer] = useState<WebContainer | null>(null);
  const booted = useRef(false);

  useEffect(() => {
    const initWebContainer = async () => {
      booted.current = true;
      const webContainer = await WebContainer.boot();
      setWebContainer(webContainer);
    };

    if (booted.current) return;
    initWebContainer();
  }, []);

  return (
    <>
      <div className='container'>
        <div className='editor'>
          <textarea>I am a textarea</textarea>
        </div>
        <div className='preview'>
          <iframe src='loading.html'></iframe>
        </div>
      </div>
    </>
  );
}

export default App;
