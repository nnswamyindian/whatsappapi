import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FlowNode, FlowEdge, Chatbot } from '../../types';
import {
  Play,
  Save,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Settings,
  MessageSquare,
  HelpCircle,
  ListPlus,
  GitFork,
  Clock,
  Tag,
  UserCheck,
  Send,
  Sparkles,
  PhoneCall,
  Power,
  Globe,
  Bot,
  RotateCcw,
  Plus,
  X,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

const NODE_CATALOG = [
  { type: 'start', label: 'Start Flow', category: 'Triggers', icon: Play, color: 'bg-emerald-500', desc: 'Entry trigger on incoming message' },
  { type: 'keyword_trigger', label: 'Keyword Trigger', category: 'Triggers', icon: Sparkles, color: 'bg-emerald-600', desc: 'Trigger on specific keyword' },
  { type: 'send_message', label: 'Send Message', category: 'Messages', icon: MessageSquare, color: 'bg-blue-500', desc: 'Text or formatted message' },
  { type: 'buttons', label: 'Interactive Buttons', category: 'Messages', icon: ListPlus, color: 'bg-blue-600', desc: 'Up to 3 quick reply buttons' },
  { type: 'list_menu', label: 'List Menu', category: 'Messages', icon: ListPlus, color: 'bg-cyan-600', desc: 'Sectioned WhatsApp menu list' },
  { type: 'template_message', label: 'Template Message', category: 'Messages', icon: Send, color: 'bg-indigo-500', desc: 'Approved Meta template' },
  { type: 'ask_question', label: 'Ask a Question', category: 'Input', icon: HelpCircle, color: 'bg-amber-500', desc: 'Ask user and wait for reply' },
  { type: 'capture_input', label: 'Capture Input', category: 'Input', icon: Tag, color: 'bg-amber-600', desc: 'Save answer to custom variable' },
  { type: 'condition_branch', label: 'Condition Branch', category: 'Logic', icon: GitFork, color: 'bg-purple-500', desc: 'Branch if variable matches' },
  { type: 'delay_wait', label: 'Delay / Wait', category: 'Logic', icon: Clock, color: 'bg-purple-600', desc: 'Pause execution for N seconds' },
  { type: 'tag_contact', label: 'Tag Contact', category: 'CRM', icon: Tag, color: 'bg-teal-500', desc: 'Add or remove contact tag' },
  { type: 'update_contact', label: 'Update CRM Stage', category: 'CRM', icon: UserCheck, color: 'bg-teal-600', desc: 'Move contact in sales pipeline' },
  { type: 'human_handoff', label: 'Human Handoff', category: 'Handoff', icon: PhoneCall, color: 'bg-rose-500', desc: 'Halt bot and assign to agent' },
  { type: 'api_request', label: 'API Request', category: 'Advanced', icon: Globe, color: 'bg-slate-700', desc: 'HTTP Webhook / JSON API call' },
  { type: 'end_flow', label: 'End Flow', category: 'Logic', icon: Power, color: 'bg-slate-500', desc: 'Terminate conversation flow' },
];

export const ChatbotStudioPage: React.FC = () => {
  const { token, activeOrg } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'editor' | 'templates'>('editor');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Simulation state
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; buttons?: string[] }>>([]);
  const [simInput, setSimInput] = useState<string>('');
  const [simCurrentNodeId, setSimCurrentNodeId] = useState<string | null>(null);
  const [simVariables, setSimVariables] = useState<Record<string, any>>({});
  const [simWaitingVar, setSimWaitingVar] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatbots();
  }, [activeOrg?.id]);

  const fetchChatbots = async () => {
    try {
      const res = await fetch('/api/v1/chatbots', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatbots(data);
        if (data.length > 0) {
          selectBot(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load chatbots', err);
    }
  };

  const selectBot = (bot: Chatbot) => {
    setSelectedBot(bot);
    const n = (bot as any).draftNodes || (bot as any).publishedNodes || bot.nodes || (bot.draft_nodes_json ? JSON.parse(bot.draft_nodes_json) : []);
    const e = (bot as any).draftEdges || (bot as any).publishedEdges || bot.edges || (bot.draft_edges_json ? JSON.parse(bot.draft_edges_json) : []);
    setNodes(n);
    setEdges(e);
    setSelectedNodeId(null);
    setValidationErrors([]);
    setPan({ x: 30, y: 40 });
    setZoom(0.95);
  };

  const handleSaveDraft = async () => {
    if (!selectedBot) return;
    setSaveStatus('Saving draft...');
    try {
      const res = await fetch(`/api/v1/chatbots/${selectedBot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedBot.name,
          description: selectedBot.description,
          trigger_keyword: selectedBot.trigger_keyword,
          nodes,
          edges,
        }),
      });
      if (res.ok) {
        setSaveStatus('Draft saved successfully');
        setTimeout(() => setSaveStatus(''), 2500);
      }
    } catch (err) {
      setSaveStatus('Failed to save draft');
    }
  };

  const handleValidate = () => {
    const errors: string[] = [];
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      errors.push('Flow must contain a Start node.');
    }
    nodes.forEach((n) => {
      if (n.type === 'send_message' && (!n.data.text || n.data.text.trim() === '')) {
        errors.push(`Send Message block "${n.id}" has empty text.`);
      }
      if (n.type === 'ask_question' && !n.data.variable) {
        errors.push(`Ask Question block "${n.id}" requires a variable to store the answer.`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePublish = async () => {
    if (!handleValidate() || !selectedBot) return;
    setSaveStatus('Publishing version...');
    try {
      const res = await fetch(`/api/v1/chatbots/${selectedBot.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nodes, edges }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveStatus(`Published v${data.version} successfully!`);
        setSelectedBot({ ...selectedBot, version: data.version, is_active: 1 });
        fetchChatbots();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const err = await res.json();
        setValidationErrors(err.errors || [err.error || 'Publishing failed']);
        setSaveStatus('');
      }
    } catch (err) {
      setSaveStatus('Error publishing flow');
    }
  };

  const handleCreateNew = async () => {
    const name = prompt('Enter a name for the new Chatbot:', 'Customer Assistant Flow');
    if (!name) return;
    const defaultNodes = [
      { id: 'start_1', type: 'start', position: { x: 80, y: 150 }, data: { label: 'Start Flow' } },
      { id: 'msg_1', type: 'send_message', position: { x: 340, y: 150 }, data: { text: 'Hi there! Welcome to our store. How can I help you today?' } },
    ];
    const defaultEdges = [{ id: 'e1', source: 'start_1', target: 'msg_1' }];

    try {
      const res = await fetch('/api/v1/chatbots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: 'Custom conversational workflow',
          trigger_keyword: 'hello',
          nodes: defaultNodes,
          edges: defaultEdges,
        }),
      });
      if (res.ok) {
        const newBot = await res.json();
        setChatbots([newBot, ...chatbots]);
        selectBot(newBot);
      }
    } catch (err) {
      alert('Failed to create chatbot');
    }
  };

  const addNode = (catalogItem: typeof NODE_CATALOG[0]) => {
    const newId = `${catalogItem.type}_${Date.now().toString(36)}`;
    const newNode: FlowNode = {
      id: newId,
      type: catalogItem.type,
      position: { x: 250 + Math.random() * 80, y: 120 + Math.random() * 80 },
      data: {
        label: catalogItem.label,
        text: catalogItem.type === 'send_message' ? 'Type your message here...' : '',
        buttons: catalogItem.type === 'buttons' ? ['Option 1', 'Option 2'] : undefined,
        variable: catalogItem.type === 'ask_question' ? 'user_response' : undefined,
      },
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newId);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(nodes.filter((n) => n.id !== selectedNodeId));
    setEdges(edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  // 1. Mouse Pad & Wheel Zoom / Pan Listener (non-passive to allow preventDefault)
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch-to-zoom or Ctrl/Meta + wheel zoom
      if (e.ctrlKey || e.metaKey) {
        const zoomDelta = -e.deltaY * 0.006;
        setZoom((prevZoom) => {
          const nextZoom = Math.min(2.5, Math.max(0.3, prevZoom + zoomDelta));
          const rect = canvasEl.getBoundingClientRect();
          const cursorX = e.clientX - rect.left;
          const cursorY = e.clientY - rect.top;
          const scaleChange = nextZoom / prevZoom;
          setPan((prevPan) => ({
            x: cursorX - (cursorX - prevPan.x) * scaleChange,
            y: cursorY - (cursorY - prevPan.y) * scaleChange,
          }));
          return nextZoom;
        });
      } else if (e.altKey) {
        // Alt + wheel zoom
        const zoomDelta = -e.deltaY * 0.003;
        setZoom((prevZoom) => Math.min(2.5, Math.max(0.3, prevZoom + zoomDelta)));
      } else {
        // Fluid two-finger trackpad panning or mouse wheel scrolling
        setPan((prevPan) => ({
          x: prevPan.x - e.deltaX * 0.9,
          y: prevPan.y - e.deltaY * 0.9,
        }));
      }
    };

    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvasEl.removeEventListener('wheel', onWheel);
    };
  }, []);

  // 2. Spacebar key listener for hand/pan tool
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. Fit to Screen calculation
  const handleFitToScreen = () => {
    if (nodes.length === 0 || !canvasRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const padding = 80;
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x + 240));
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + 140));

    const contentWidth = Math.max(100, maxX - minX);
    const contentHeight = Math.max(100, maxY - minY);

    const availableWidth = Math.max(100, canvasRect.width - padding * 2);
    const availableHeight = Math.max(100, canvasRect.height - padding * 2);

    const fitZoom = Math.min(
      1.3,
      Math.max(0.4, Math.min(availableWidth / contentWidth, availableHeight / contentHeight))
    );

    const centerX = (canvasRect.width - contentWidth * fitZoom) / 2 - minX * fitZoom;
    const centerY = (canvasRect.height - contentHeight * fitZoom) / 2 - minY * fitZoom;

    setZoom(fitZoom);
    setPan({ x: centerX, y: centerY });
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setIsDraggingNode(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: e.clientX - node.position.x * zoom - pan.x,
        y: e.clientY - node.position.y * zoom - pan.y,
      });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Left-click on canvas background or middle-click or Space+drag initiates flexible canvas pan
    if (e.button === 0 || e.button === 1 || isSpacePressed) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
      setSelectedNodeId(null);
      setConnectingSource(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDraggingNode) {
      const newX = Math.round((e.clientX - dragOffset.x - pan.x) / zoom);
      const newY = Math.round((e.clientY - dragOffset.y - pan.y) / zoom);
      setNodes((prevNodes) =>
        prevNodes.map((n) => (n.id === isDraggingNode ? { ...n, position: { x: newX, y: newY } } : n))
      );
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsDraggingNode(null);
    setIsPanning(false);
  };

  const handlePortClick = (nodeId: string, isOutput: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutput) {
      setConnectingSource(nodeId);
    } else if (connectingSource && connectingSource !== nodeId) {
      // Connect source to target
      const newEdge: FlowEdge = {
        id: `e_${connectingSource}_${nodeId}_${Date.now().toString(36)}`,
        source: connectingSource,
        target: nodeId,
      };
      setEdges([...edges, newEdge]);
      setConnectingSource(null);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Simulation Logic
  const startSimulation = () => {
    setIsSimulatorOpen(true);
    setSimMessages([]);
    setSimVariables({});
    setSimWaitingVar(null);
    const startNode = nodes.find((n) => n.type === 'start');
    if (!startNode) {
      setSimMessages([{ sender: 'bot', text: 'Error: No Start node found in this flow.' }]);
      return;
    }
    executeSimStep(startNode.id, {});
  };

  const executeSimStep = (nodeId: string, currentVars: Record<string, any>) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setSimCurrentNodeId(node.id);

    if (node.type === 'start') {
      const nextEdge = edges.find((e) => e.source === node.id);
      if (nextEdge) executeSimStep(nextEdge.target, currentVars);
    } else if (node.type === 'send_message') {
      let text = node.data.text || '';
      Object.entries(currentVars).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
      setSimMessages((prev) => [...prev, { sender: 'bot', text }]);
      const nextEdge = edges.find((e) => e.source === node.id);
      if (nextEdge) {
        setTimeout(() => executeSimStep(nextEdge.target, currentVars), 600);
      }
    } else if (node.type === 'buttons') {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: node.data.text || 'Choose an option:', buttons: node.data.buttons || [] },
      ]);
      // Wait for user click
    } else if (node.type === 'ask_question') {
      setSimMessages((prev) => [...prev, { sender: 'bot', text: node.data.question || 'Please enter your reply:' }]);
      setSimWaitingVar(node.data.variable || 'temp_var');
    } else if (node.type === 'tag_contact') {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: `[System]: Tagged contact with "${node.data.tag || 'New Tag'}"` },
      ]);
      const nextEdge = edges.find((e) => e.source === node.id);
      if (nextEdge) setTimeout(() => executeSimStep(nextEdge.target, currentVars), 500);
    } else if (node.type === 'human_handoff') {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: node.data.transferMessage || 'Transferred to live agent. Bot replies suspended.' },
      ]);
    } else if (node.type === 'end_flow') {
      setSimMessages((prev) => [...prev, { sender: 'bot', text: '✅ Flow completed.' }]);
    }
  };

  const handleSimSend = () => {
    if (!simInput.trim()) return;
    const text = simInput.trim();
    setSimMessages((prev) => [...prev, { sender: 'user', text }]);
    setSimInput('');

    if (simWaitingVar && simCurrentNodeId) {
      const updatedVars = { ...simVariables, [simWaitingVar]: text };
      setSimVariables(updatedVars);
      setSimWaitingVar(null);
      const nextEdge = edges.find((e) => e.source === simCurrentNodeId);
      if (nextEdge) {
        setTimeout(() => executeSimStep(nextEdge.target, updatedVars), 600);
      }
    } else if (simCurrentNodeId) {
      // Check if button match or next edge with button label
      const matchingEdge = edges.find(
        (e) => e.source === simCurrentNodeId && e.label?.toLowerCase() === text.toLowerCase()
      ) || edges.find((e) => e.source === simCurrentNodeId);

      if (matchingEdge) {
        setTimeout(() => executeSimStep(matchingEdge.target, simVariables), 600);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden">
      {/* Top Studio Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedBot?.id || ''}
                onChange={(e) => {
                  const b = chatbots.find((item) => item.id === e.target.value);
                  if (b) selectBot(b);
                }}
                className="font-bold text-slate-800 text-sm bg-transparent border-none focus:ring-0 cursor-pointer p-0"
              >
                {chatbots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                v{selectedBot?.version || 1}
              </span>
              {selectedBot?.is_active ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  Draft
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Trigger: <strong className="text-slate-600 font-mono">"{selectedBot?.trigger_keyword || 'hi'}"</strong></span>
              <span>•</span>
              <span>{selectedBot?.execution_count || 0} executions</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs font-semibold text-brand-700 animate-fade-in bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Bot
          </button>
          <button
            onClick={startSimulation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600" />
            Test Simulation
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Publish Version
          </button>
        </div>
      </div>

      {/* Validation Banner if errors */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>Validation Issues:</strong> {validationErrors.join(' | ')}</span>
          </div>
          <button onClick={() => setValidationErrors([])} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Studio Workspace: 3 Columns (Catalog, Canvas, Node Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Node Catalog Panel */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Node Palette
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{NODE_CATALOG.length} Blocks</span>
          </div>

          <div className="p-2 overflow-y-auto flex-1 space-y-3">
            {['Triggers', 'Messages', 'Input', 'Logic', 'CRM', 'Handoff', 'Advanced'].map((cat) => {
              const catNodes = NODE_CATALOG.filter((item) => item.category === cat);
              if (catNodes.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    {cat}
                  </div>
                  <div className="space-y-1">
                    {catNodes.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => addNode(item)}
                        className="w-full text-left p-2 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/40 transition-all flex items-start gap-2.5 group"
                      >
                        <div className={`w-7 h-7 rounded-lg ${item.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-brand-900 truncate">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Interactive Node Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseLeave}
          className={`flex-1 bg-slate-100/70 relative overflow-hidden select-none transition-cursor ${
            isDraggingNode
              ? 'cursor-default'
              : isPanning
              ? 'cursor-grabbing'
              : isSpacePressed
              ? 'cursor-grab'
              : 'cursor-grab active:cursor-grabbing'
          }`}
          style={{
            backgroundImage: `radial-gradient(#CBD5E1 1.2px, transparent 1.2px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Canvas SVG Connecting Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#16A34A" />
              </marker>
            </defs>
            {edges.map((e) => {
              const srcNode = nodes.find((n) => n.id === e.source);
              const tgtNode = nodes.find((n) => n.id === e.target);
              if (!srcNode || !tgtNode) return null;

              const x1 = srcNode.position.x * zoom + pan.x + 220 * zoom;
              const y1 = srcNode.position.y * zoom + pan.y + 45 * zoom;
              const x2 = tgtNode.position.x * zoom + pan.x;
              const y2 = tgtNode.position.y * zoom + pan.y + 45 * zoom;
              const dx = Math.max(40, (x2 - x1) / 2);

              return (
                <g key={e.id}>
                  <path
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth={2.5 * zoom}
                    markerEnd="url(#arrow)"
                    className="transition-all"
                  />
                  {e.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill="#1E293B"
                      fontSize={11 * zoom}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-white px-1"
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Canvas Floating Nodes */}
          <div
            className="absolute inset-0 transform-gpu"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {nodes.map((n) => {
              const catalogMatch = NODE_CATALOG.find((c) => c.type === n.type);
              const Icon = catalogMatch?.icon || Bot;
              const isSelected = selectedNodeId === n.id;
              const isConnecting = connectingSource === n.id;

              return (
                <div
                  key={n.id}
                  onMouseDown={(e) => handleNodeMouseDown(n.id, e)}
                  style={{
                    position: 'absolute',
                    left: `${n.position.x}px`,
                    top: `${n.position.y}px`,
                    width: '230px',
                  }}
                  className={`bg-white rounded-2xl shadow-md border-2 transition-shadow cursor-pointer select-none z-10 ${
                    isSelected
                      ? 'border-brand-600 ring-4 ring-brand-100 shadow-xl'
                      : isConnecting
                      ? 'border-indigo-500 ring-4 ring-indigo-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Node Header */}
                  <div
                    className={`px-3 py-2 rounded-t-[14px] flex items-center justify-between text-white ${
                      catalogMatch?.color || 'bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate">
                        {n.data.label || catalogMatch?.label || n.type}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-black/20 text-white">
                      {n.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Node Body Content */}
                  <div className="p-3 text-xs text-slate-600 space-y-1.5">
                    {n.type === 'send_message' && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-700 line-clamp-2">
                        {n.data.text || <em className="text-slate-400">No message set...</em>}
                      </div>
                    )}
                    {n.type === 'buttons' && (
                      <div className="space-y-1">
                        <div className="text-[11px] text-slate-700 font-medium truncate">{n.data.text}</div>
                        <div className="flex flex-wrap gap-1">
                          {(n.data.buttons || ['Option 1']).map((b: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {n.type === 'ask_question' && (
                      <div className="text-[11px] space-y-1">
                        <div className="text-slate-700 font-medium truncate">{n.data.question}</div>
                        <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                          var: <strong>{n.data.variable || 'unassigned'}</strong>
                        </div>
                      </div>
                    )}
                    {n.type === 'tag_contact' && (
                      <div className="text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded font-bold">
                        Tag: +{n.data.tag || 'Lead'}
                      </div>
                    )}
                    {n.type === 'human_handoff' && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded font-bold flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> Stop bot replies
                      </div>
                    )}
                    {n.type === 'start' && (
                      <div className="text-[11px] text-emerald-700">Inbound WhatsApp Trigger</div>
                    )}
                  </div>

                  {/* Input Port (Left) */}
                  {n.type !== 'start' && (
                    <button
                      onClick={(e) => handlePortClick(n.id, false, e)}
                      title="Connect target input"
                      className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-slate-400 hover:border-brand-600 hover:scale-125 transition-all flex items-center justify-center shadow-xs"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    </button>
                  )}

                  {/* Output Port (Right) */}
                  {n.type !== 'end_flow' && (
                    <button
                      onClick={(e) => handlePortClick(n.id, true, e)}
                      title="Click to connect to next block"
                      className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-500 border-2 border-white hover:bg-brand-600 hover:scale-125 transition-all flex items-center justify-center shadow-xs"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas Floating Zoom & Pan Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-md">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                title="Zoom In (Ctrl + Wheel)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                title="Zoom Out (Ctrl + Wheel)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleFitToScreen}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors flex items-center gap-1"
                title="Fit all blocks to screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                title="Reset View to 100%"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-slate-600 px-2 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 shadow-xs">
              <span className="font-semibold text-brand-700">Mouse pad:</span>
              <span>2-finger scroll to pan • pinch to zoom • drag canvas freely</span>
            </div>
          </div>

          {/* Connecting Instruction Pill */}
          {connectingSource && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse z-30 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5" /> Click target block's left port to complete connection
              <button onClick={() => setConnectingSource(null)} className="ml-2 hover:bg-indigo-700 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Node Inspector / Properties Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shadow-xs">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-brand-600" />
              Node Properties
            </span>
            {selectedNode && (
              <button
                onClick={deleteSelectedNode}
                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Node"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Node Title
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNodes(
                      nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n))
                    );
                  }}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {selectedNode.type === 'send_message' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    WhatsApp Message Text
                  </label>
                  <textarea
                    rows={4}
                    value={selectedNode.data.text || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      setNodes(
                        nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, text } } : n))
                      );
                    }}
                    placeholder="Enter message text... (supports {{name}} variables)"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Use {'{{company_name}}'} or {'{{first_name}}'} for dynamic personalization.
                  </p>
                </div>
              )}

              {selectedNode.type === 'buttons' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Body Prompt
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.text || ''}
                      onChange={(e) => {
                        const text = e.target.value;
                        setNodes(
                          nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, text } } : n))
                        );
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Quick Reply Buttons (Max 3)
                    </label>
                    <div className="space-y-1.5">
                      {(selectedNode.data.buttons || ['Option 1', 'Option 2']).map((btn: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={btn}
                            onChange={(e) => {
                              const updated = [...(selectedNode.data.buttons || [])];
                              updated[idx] = e.target.value;
                              setNodes(
                                nodes.map((n) =>
                                  n.id === selectedNode.id ? { ...n, data: { ...n.data, buttons: updated } } : n
                                )
                              );
                            }}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.type === 'ask_question' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Question Prompt
                    </label>
                    <textarea
                      rows={2}
                      value={selectedNode.data.question || ''}
                      onChange={(e) => {
                        const question = e.target.value;
                        setNodes(
                          nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, question } } : n))
                        );
                      }}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Save Answer To Variable
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.variable || ''}
                      onChange={(e) => {
                        const variable = e.target.value;
                        setNodes(
                          nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, variable } } : n))
                        );
                      }}
                      placeholder="e.g. company_name, email"
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === 'tag_contact' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contact Tag to Apply
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.tag || ''}
                    onChange={(e) => {
                      const tag = e.target.value;
                      setNodes(
                        nodes.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, tag } } : n))
                      );
                    }}
                    placeholder="e.g. Demo-Requested, Qualified"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {selectedNode.type === 'human_handoff' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Customer Handoff Notice
                  </label>
                  <textarea
                    rows={3}
                    value={selectedNode.data.transferMessage || ''}
                    onChange={(e) => {
                      const transferMessage = e.target.value;
                      setNodes(
                        nodes.map((n) =>
                          n.id === selectedNode.id ? { ...n, data: { ...n.data, transferMessage } } : n
                        )
                      );
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This automatically marks the conversation as <strong>Human Controlled</strong> and alerts the team inbox.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400">
                <div className="flex justify-between py-1">
                  <span>Block ID:</span>
                  <span className="font-mono text-slate-600">{selectedNode.id}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Connected Targets:</span>
                  <span className="font-semibold text-slate-600">
                    {edges.filter((e) => e.source === selectedNode.id).length}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-full space-y-2">
              <Info className="w-8 h-8 text-slate-300" />
              <div className="text-xs font-semibold text-slate-600">No Block Selected</div>
              <div className="text-[11px] text-slate-400">
                Click any node on the canvas to configure messages, buttons, variables, and branches.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Simulation Drawer / Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[650px] border border-slate-200">
            {/* Simulator Header */}
            <div className="bg-brand-700 px-4 py-3 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold">Flow Simulator: {selectedBot?.name}</div>
                  <div className="text-[10px] text-brand-200">Live WhatsApp Sandbox Preview</div>
                </div>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Phone Message Thread */}
            <div
              className="flex-1 bg-[#EFEAE2] p-4 overflow-y-auto space-y-3"
              style={{
                backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px',
              }}
            >
              <div className="text-center">
                <span className="text-[10px] bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full text-slate-500 font-semibold shadow-2xs">
                  Today • WhatsApp Verified
                </span>
              </div>

              {simMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-xs text-xs ${
                      m.sender === 'user'
                        ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-none'
                        : 'bg-white text-slate-900 rounded-tl-none'
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className="text-[9px] text-slate-400 text-right mt-1">12:00 PM</div>
                  </div>

                  {/* Interactive Button Chips */}
                  {m.buttons && m.buttons.length > 0 && (
                    <div className="mt-1.5 flex flex-col gap-1 w-[80%]">
                      {m.buttons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => {
                            setSimMessages((prev) => [...prev, { sender: 'user', text: btn }]);
                            if (simCurrentNodeId) {
                              const matchingEdge = edges.find(
                                (e) =>
                                  e.source === simCurrentNodeId &&
                                  e.label?.toLowerCase() === btn.toLowerCase()
                              ) || edges.find((e) => e.source === simCurrentNodeId);
                              if (matchingEdge) {
                                setTimeout(() => executeSimStep(matchingEdge.target, simVariables), 500);
                              }
                            }
                          }}
                          className="bg-white hover:bg-slate-50 text-brand-700 font-bold text-xs py-2 px-3 rounded-xl border border-slate-200 shadow-2xs text-center transition-all"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Captured Variables Inspector Pill */}
            {Object.keys(simVariables).length > 0 && (
              <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                <span className="font-bold text-slate-500">Variables:</span>
                {Object.entries(simVariables).map(([k, v]) => (
                  <span key={k} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {k}={String(v)}
                  </span>
                ))}
              </div>
            )}

            {/* Input Composer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimSend()}
                placeholder={simWaitingVar ? `Answer for ${simWaitingVar}...` : 'Type a WhatsApp message...'}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={handleSimSend}
                className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
