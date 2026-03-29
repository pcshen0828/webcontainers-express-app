import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import '@xterm/xterm/css/xterm.css';
import { WebContainer, type FileNode } from '@webcontainer/api';
import { files } from './files';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const DEFAULT_CONTAINER_HEIGHT = 320;
const MIN_CONTAINER_HEIGHT = 100;
const MIN_TERMINAL_HEIGHT = 80;

function App() {
  const [webContainer, setWebContainer] = useState<WebContainer | null>(null);
  const [content, setContent] = useState((files['index.js'] as FileNode).file.contents as string);
  const [containerHeight, setContainerHeight] = useState(DEFAULT_CONTAINER_HEIGHT);

  const booted = useRef(false);
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const terminalEl = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const shellProcessRef = useRef<Awaited<ReturnType<WebContainer['spawn']>> | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null);

  const startShell = useCallback(async (container: WebContainer, terminal: Terminal) => {
    const shellProcess = await container.spawn('jsh', {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    });
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

  const fitTerminal = useCallback(() => {
    fitAddonRef.current?.fit();
    shellProcessRef.current?.resize({
      cols: terminalRef.current?.cols ?? 0,
      rows: terminalRef.current?.rows ?? 0,
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

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragState.current = { startY: e.clientY, startHeight: containerHeight };

      const onMouseMove = (e: MouseEvent) => {
        if (!dragState.current) return;
        const delta = e.clientY - dragState.current.startY;
        const newHeight = dragState.current.startHeight + delta;
        const maxHeight = window.innerHeight - MIN_TERMINAL_HEIGHT;
        setContainerHeight(Math.max(MIN_CONTAINER_HEIGHT, Math.min(newHeight, maxHeight)));
      };

      const onMouseUp = () => {
        dragState.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        fitTerminal();
      };

      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [containerHeight, fitTerminal],
  );

  useEffect(() => {
    const initWebContainer = async () => {
      booted.current = true;

      const webContainer = await WebContainer.boot();
      setWebContainer(webContainer);
      await webContainer.mount(files);

      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;

      const terminal = new Terminal({ convertEol: true });
      terminalRef.current = terminal;

      if (terminalEl.current) {
        terminal.loadAddon(fitAddon);
        terminal.open(terminalEl.current);
        fitAddon.fit();
      }

      webContainer.on('server-ready', (_, url) => {
        if (!iframeEl.current) return;
        iframeEl.current.src = url;
      });

      shellProcessRef.current = await startShell(webContainer, terminal);
    };

    if (booted.current) return;
    initWebContainer();
  }, [startShell]);

  useEffect(() => {
    window.addEventListener('resize', fitTerminal);
    return () => window.removeEventListener('resize', fitTerminal);
  }, [fitTerminal]);

  return (
    <div className='layout'>
      <header>
        <h1>
          Hello, <span className='wc'>WebContainers API</span>!
        </h1>
        <p>
          <a className='docs' href='https://webcontainers.io' target='_blank' rel='noreferrer noopener'>
            Read the docs 📚
          </a>
        </p>
      </header>
      <div className='container' style={{ height: containerHeight }}>
        <div className='editor'>
          <textarea value={content} onChange={handleContentChange}>
            I am a textarea
          </textarea>
        </div>
        <div className='preview'>
          <iframe ref={iframeEl} src='loading.html'></iframe>
        </div>
      </div>
      <div className='drag-handle' onMouseDown={handleDragMouseDown}>
        <div className='drag-handle-bar' />
      </div>
      <div className='terminal-wrapper'>
        <div className='terminal' ref={terminalEl}></div>
      </div>
    </div>
  );
}

export default App;
