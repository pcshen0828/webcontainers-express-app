import { useCallback, useEffect, useRef } from 'react';
import './App.css';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';

function App() {
  const booted = useRef(false);
  const iframeEl = useRef<HTMLIFrameElement>(null);

  const installDependencies = useCallback(async (container: WebContainer) => {
    const installProcess = await container.spawn('npm', ['install']);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      }),
    );

    // Wait for install command to exit
    return installProcess.exit;
  }, []);

  const startDevServer = useCallback(async (container: WebContainer) => {
    // Run `npm run start` to start the Express app
    await container.spawn('npm', ['run', 'start']);

    // Wait for `server-ready` event
    container.on('server-ready', (_, url) => {
      if (!iframeEl.current) return;
      iframeEl.current.src = url;
    });
  }, []);

  useEffect(() => {
    const initWebContainer = async () => {
      booted.current = true;
      const webContainer = await WebContainer.boot();
      await webContainer.mount(files);

      const exitCode = await installDependencies(webContainer);
      if (exitCode !== 0) {
        throw new Error('Installation failed');
      }

      await startDevServer(webContainer);
    };

    if (booted.current) return;
    initWebContainer();
  }, [installDependencies, startDevServer]);

  return (
    <>
      <div className='container'>
        <div className='editor'>
          <textarea value={files['index.js'].file.contents}>I am a textarea</textarea>
        </div>
        <div className='preview'>
          <iframe ref={iframeEl} src='loading.html'></iframe>
        </div>
      </div>
    </>
  );
}

export default App;
