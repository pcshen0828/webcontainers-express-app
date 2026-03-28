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

  const startShell = useCallback(async (container: WebContainer, terminal: Terminal) => {
    const shellProcess = await container.spawn('jsh');
    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data);
        },
      }),
    );

    const input = shellProcess.input.getWriter();
    terminal.onData((data) => {
      input.write(data);
    });

    return shellProcess;
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
      await webContainer.mount(files);

      const terminal = new Terminal({
        convertEol: true,
      });
      if (terminalEl.current) {
        terminal.open(terminalEl.current);
      }

      webContainer.on('server-ready', (_, url) => {
        if (!iframeEl.current) return;
        iframeEl.current.src = url;
      });

      startShell(webContainer, terminal);
    };

    if (booted.current) return;
    initWebContainer();
  }, [startShell]);

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
