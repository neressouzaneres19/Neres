import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Save, ArrowLeft, Edit2, ChevronRight, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mixture, Batch } from './types';

const STORAGE_KEY = 'agromix_data';

export default function App() {
  const [mixtures, setMixtures] = useState<Mixture[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [currentMixture, setCurrentMixture] = useState<Mixture | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMixtures(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading data', e);
      }
    }
  }, []);

  // Save data to localStorage
  const saveToStorage = (updatedMixtures: Mixture[]) => {
    setMixtures(updatedMixtures);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMixtures));
  };

  const handleCreateNew = () => {
    const newMixture: Mixture = {
      id: crypto.randomUUID(),
      name: '',
      number: '',
      batches: [{ id: crypto.randomUUID(), name: '', weightKg: 0 }],
      secondaryBatches: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentMixture(newMixture);
    setView('create');
  };

  const handleEdit = (mixture: Mixture) => {
    setCurrentMixture({
      ...mixture,
      secondaryBatches: mixture.secondaryBatches || []
    });
    setView('edit');
  };

  const handleView = (mixture: Mixture) => {
    setCurrentMixture({
      ...mixture,
      secondaryBatches: mixture.secondaryBatches || []
    });
    setView('view');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta mistura?')) {
      const updated = mixtures.filter((m) => m.id !== id);
      saveToStorage(updated);
      if (currentMixture?.id === id) {
        setView('list');
        setCurrentMixture(null);
      }
    }
  };

  const handleSave = () => {
    if (!currentMixture) return;
    if (!currentMixture.name || !currentMixture.number) {
      alert('Por favor, preencha o nome e o número da mistura.');
      return;
    }

    // Filter out empty batches (no name AND 0 weight)
    const filteredBatches = currentMixture.batches.filter(b => b.name.trim() !== '' || b.weightKg > 0);
    const filteredSecondaryBatches = (currentMixture.secondaryBatches || []).filter(b => b.name.trim() !== '' || b.weightKg > 0);

    if (filteredBatches.length === 0) {
      alert('Por favor, adicione pelo menos um lote principal preenchido.');
      return;
    }

    let updatedMixtures: Mixture[];
    const savedMixture = { 
      ...currentMixture, 
      batches: filteredBatches,
      secondaryBatches: filteredSecondaryBatches,
      updatedAt: Date.now() 
    };

    if (view === 'create') {
      updatedMixtures = [
        ...mixtures,
        { ...savedMixture, createdAt: Date.now() },
      ];
    } else {
      updatedMixtures = mixtures.map((m) =>
        m.id === currentMixture.id ? savedMixture : m
      );
    }

    saveToStorage(updatedMixtures);
    setCurrentMixture(savedMixture);
    setView('view');
  };

  const addBatch = (type: 'primary' | 'secondary') => {
    if (!currentMixture) return;
    const newBatch: Batch = {
      id: crypto.randomUUID(),
      name: '',
      weightKg: 0,
    };
    
    if (type === 'primary') {
      setCurrentMixture({
        ...currentMixture,
        batches: [...currentMixture.batches, newBatch],
      });
    } else {
      setCurrentMixture({
        ...currentMixture,
        secondaryBatches: [...(currentMixture.secondaryBatches || []), newBatch],
      });
    }
  };

  const removeBatch = (batchId: string, type: 'primary' | 'secondary') => {
    if (!currentMixture) return;
    if (type === 'primary') {
      if (currentMixture.batches.length <= 1) return;
      setCurrentMixture({
        ...currentMixture,
        batches: currentMixture.batches.filter((b) => b.id !== batchId),
      });
    } else {
      setCurrentMixture({
        ...currentMixture,
        secondaryBatches: (currentMixture.secondaryBatches || []).filter((b) => b.id !== batchId),
      });
    }
  };

  const updateBatch = (batchId: string, field: keyof Batch, value: string | number, type: 'primary' | 'secondary') => {
    if (!currentMixture) return;
    if (type === 'primary') {
      setCurrentMixture({
        ...currentMixture,
        batches: currentMixture.batches.map((b) =>
          b.id === batchId ? { ...b, [field]: value } : b
        ),
      });
    } else {
      setCurrentMixture({
        ...currentMixture,
        secondaryBatches: (currentMixture.secondaryBatches || []).map((b) =>
          b.id === batchId ? { ...b, [field]: value } : b
        ),
      });
    }
  };

  const totalWeight = useMemo(() => {
    if (!currentMixture) return 0;
    return currentMixture.batches.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
  }, [currentMixture]);

  const totalSecondaryWeight = useMemo(() => {
    if (!currentMixture || !currentMixture.secondaryBatches) return 0;
    return currentMixture.secondaryBatches.reduce((sum, b) => sum + (Number(b.weightKg) || 0), 0);
  }, [currentMixture]);

  const filteredMixtures = useMemo(() => {
    return mixtures.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.number.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [mixtures, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-green-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Agropek</h1>
          </div>
          {view === 'list' && (
            <button
              onClick={handleCreateNew}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nova Mistura
            </button>
          )}
        </div>
      </header>

      <main className="w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou número da mistura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-lg"
                />
              </div>

              {/* List */}
              <div className="grid gap-4">
                {filteredMixtures.length > 0 ? (
                  filteredMixtures.map((m) => (
                    <motion.div
                      layout
                      key={m.id}
                      onDoubleClick={() => handleView(m)}
                      className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between group hover:border-green-300 hover:shadow-md transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-green-50 rounded-2xl overflow-hidden border border-green-100 flex-shrink-0 shadow-inner flex items-center justify-center p-3">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/2666/2666505.png"
                            alt="Prancheta Agropek"
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              #{m.number}
                            </span>
                            <h3 className="text-lg font-semibold">{m.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500">
                            {m.batches.length} lotes principais • {m.secondaryBatches?.length || 0} lotes secundários
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(m)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-full transition-colors"
                          title="Visualizar"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="text-gray-300 w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma mistura encontrada.</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-green-600 font-semibold mt-2 hover:underline"
                      >
                        Limpar pesquisa
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : view === 'view' ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{currentMixture?.name}</h2>
                    <p className="text-sm text-gray-400 font-mono">Mistura #{currentMixture?.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDelete(currentMixture!.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleEdit(currentMixture!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar Mistura
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Primary Column View */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-green-100 pb-2">
                      <h3 className="font-bold text-green-800 uppercase tracking-widest text-sm">Lotes Principais</h3>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {currentMixture?.batches.length} itens
                      </span>
                    </div>
                    <div className="space-y-2">
                      {currentMixture?.batches.map((batch, idx) => (
                        <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-300">0{idx + 1}</span>
                            <span className="font-medium">{batch.name || 'Sem nome'}</span>
                          </div>
                          <span className="font-mono font-bold text-green-700">{batch.weightKg.toFixed(2)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-600 text-white p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold uppercase">Total Principal</span>
                      <span className="text-xl font-mono font-bold">{totalWeight.toFixed(2)} kg</span>
                    </div>
                  </div>

                  {/* Secondary Column View */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <h3 className="font-bold text-blue-800 uppercase tracking-widest text-sm">Lotes Secundários</h3>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {currentMixture?.secondaryBatches.length} itens
                      </span>
                    </div>
                    <div className="space-y-2">
                      {currentMixture?.secondaryBatches.map((batch, idx) => (
                        <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-300">0{idx + 1}</span>
                            <span className="font-medium">{batch.name || 'Sem nome'}</span>
                          </div>
                          <span className="font-mono font-bold text-blue-700">{batch.weightKg.toFixed(2)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold uppercase">Total Secundário</span>
                      <span className="text-xl font-mono font-bold">{totalSecondaryWeight.toFixed(2)} kg</span>
                    </div>
                  </div>
                </div>

                {/* Total sum removed as requested */}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView('list')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {view === 'create' ? 'Nova Mistura' : 'Editar Mistura'}
                  </h2>
                </div>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-600/20"
                >
                  <Save className="w-5 h-5" />
                  Salvar e Finalizar
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
                      Nome da Mistura
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Fertilizante NPK Especial"
                      value={currentMixture?.name || ''}
                      onChange={(e) =>
                        setCurrentMixture((prev) => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">
                      Número da Mistura
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2024-001"
                      value={currentMixture?.number || ''}
                      onChange={(e) =>
                        setCurrentMixture((prev) => (prev ? { ...prev, number: e.target.value } : null))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Parallel Columns Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Column 1: Primary Batches */}
                  <div className="space-y-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        Lotes Principais
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          {currentMixture?.batches.length}
                        </span>
                      </h3>
                      <button
                        onClick={() => addBatch('primary')}
                        className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg transition-colors border border-green-100"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Lote
                      </button>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {currentMixture?.batches.map((batch, index) => (
                          <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-end gap-3 bg-white p-4 rounded-2xl border border-gray-100 group shadow-sm"
                          >
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Lote #{index + 1}
                              </label>
                              <input
                                type="text"
                                placeholder="Nome do produto"
                                value={batch.name}
                                onChange={(e) => updateBatch(batch.id, 'name', e.target.value, 'primary')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-green-500 transition-all"
                              />
                            </div>
                            <div className="w-32 space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Peso (kg)
                              </label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={batch.weightKg || ''}
                                onChange={(e) => updateBatch(batch.id, 'weightKg', parseFloat(e.target.value) || 0, 'primary')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:border-green-500 transition-all font-mono text-right"
                              />
                            </div>
                            <button
                              onClick={() => removeBatch(batch.id, 'primary')}
                              disabled={currentMixture.batches.length <= 1}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Column 1 Total */}
                    <div className="bg-green-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-green-600/10">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Principal</p>
                      <p className="text-2xl font-mono font-bold">{totalWeight.toFixed(2)} kg</p>
                    </div>
                  </div>

                  {/* Column 2: Secondary Batches */}
                  <div className="space-y-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                        Lotes Secundários
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {currentMixture?.secondaryBatches.length}
                        </span>
                      </h3>
                      <button
                        onClick={() => addBatch('secondary')}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Lote
                      </button>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {currentMixture?.secondaryBatches.map((batch, index) => (
                          <motion.div
                            key={batch.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-end gap-3 bg-white p-4 rounded-2xl border border-blue-100 group shadow-sm"
                          >
                            <div className="flex-1 space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                Lote Sec. #{index + 1}
                              </label>
                              <input
                                type="text"
                                placeholder="Nome do produto"
                                value={batch.name}
                                onChange={(e) => updateBatch(batch.id, 'name', e.target.value, 'secondary')}
                                className="w-full bg-blue-50/30 border border-blue-100 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-all"
                              />
                            </div>
                            <div className="w-32 space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                Peso (kg)
                              </label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={batch.weightKg || ''}
                                onChange={(e) => updateBatch(batch.id, 'weightKg', parseFloat(e.target.value) || 0, 'secondary')}
                                className="w-full bg-blue-50/30 border border-blue-100 rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 transition-all font-mono text-right"
                              />
                            </div>
                            <button
                              onClick={() => removeBatch(batch.id, 'secondary')}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Column 2 Total */}
                    <div className="bg-blue-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-600/10">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Secundário</p>
                      <p className="text-2xl font-mono font-bold">{totalSecondaryWeight.toFixed(2)} kg</p>
                    </div>

                    {/* Secondary Save Button */}
                    <button
                      onClick={handleSave}
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-700/20 border border-blue-500/30"
                    >
                      <Save className="w-5 h-5" />
                      Salvar e Finalizar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full p-8 text-center text-gray-400 text-xs">
        <p>© 2026 Agropek - Sistema de Gestão de Misturas Agrícolas</p>
      </footer>
    </div>
  );
}
