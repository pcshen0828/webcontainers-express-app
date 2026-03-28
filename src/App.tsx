import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import '@xterm/xterm/css/xterm.css';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';
import { Terminal } from '@xterm/xterm';

function App() {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [content, setContent] = useState(files['index.js'].file.contents);

  const booted = useRef(false);
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const terminalEl = useRef<HTMLDivElement>(null);

  const installDependencies = useCallback(async (container: WebContainer, terminal: Terminal) => {
    const installProcess = await container.spawn('npm', ['install']);

    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      }),
    );

    // Wait for install command to exit
    return installProcess.exit;
  }, []);

  const startDevServer = useCallback(async (container: WebContainer, terminal: Terminal) => {
    // Run `npm run start` to start the Express app
    const serverProcess = await container.spawn('npm', ['run', 'start']);

    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      }),
    );

    // Wait for `server-ready` event
    container.on('server-ready', (_, url) => {
      if (!iframeEl.current) return;
      iframeEl.current.src = url;
    });
  }, []);

  const handleContentChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      if (!webContainer) return;
      await webContainer.fs.writeFile('index.js', e.target.value);
    },
    [webContainer],
  );

  useEffect(() => {
    const initWebContainer = async () => {
      booted.current = true;
      const webContainer = await WebContainer.boot();
      setWebContainer(webContainer);

      const terminal = new Terminal({
        convertEol: true,
      });
      if (terminalEl.current) {
        terminal.open(terminalEl.current);
      }

      await webContainer.mount(files);

      const exitCode = await installDependencies(webContainer, terminal);
      if (exitCode !== 0) {
        throw new Error('Installation failed');
      }

      await startDevServer(webContainer, terminal);
    };

    if (booted.current) return;
    initWebContainer();
  }, [installDependencies, startDevServer]);

  return (
    <>
      <div className='container'>
        <div className='editor'>
          <textarea value={content} onChange={handleContentChange}>
            I am a textarea
          </textarea>
        </div>
        <div className='preview'>
          <iframe ref={iframeEl} src='loading.html'></iframe>
        </div>
      </div>
      <div className='terminal' ref={terminalEl}></div>
    </>
  );
}

export default App;
